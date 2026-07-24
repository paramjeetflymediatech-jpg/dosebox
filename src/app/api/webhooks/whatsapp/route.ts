export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Medicine, User, Order, OrderItem } from '@/models';

// WhatsApp Verification Token (set in .env)
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// GET method is used for Webhook Verification by Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  return new NextResponse('Bad Request', { status: 400 });
}

// POST method handles incoming WhatsApp messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if it's a WhatsApp business account event
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const messages = value?.messages;

      // Ensure there is a message and it's a text message
      if (messages && messages[0] && messages[0].type === 'text') {
        const messageObj = messages[0];
        const phone = messageObj.from; // Sender's phone number
        const messageText = messageObj.text.body;
        const userName = value.contacts?.[0]?.profile?.name || 'WhatsApp Customer';

        console.log(`Received message from ${phone}: ${messageText}`);

        // Process message and generate reply
        const botReply = await processMessageAndGenerateReply(messageText, phone, userName);

        // Send reply back via Meta API
        await sendWhatsAppMessage(phone, botReply);
      }
      
      // Always return 200 OK so Meta knows we received the webhook
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return new NextResponse('Not a WhatsApp event', { status: 404 });
    }
  } catch (error: any) {
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

async function sendWhatsAppMessage(to: string, text: string) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.error('WhatsApp credentials are not set in .env');
    return;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: text }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Error sending WhatsApp message:', data);
    } else {
      console.log(`Message sent to ${to} successfully.`);
    }
  } catch (error) {
    console.error('Failed to call Meta Graph API:', error);
  }
}

async function processMessageAndGenerateReply(message: string, phone: string, userName: string): Promise<string> {
  try {
    // 1. Identify User
    let user = await User.findOne({ where: { phone: phone || 'unknown' } });
    if (!user) {
      user = await User.create({
        name: userName,
        phone,
        email: `wa_${Date.now()}@example.com`,
        password: 'whatsapp_generated',
        roleId: 2, // Customer Role
        status: 'active'
      });
    }

    // 2. Parse Intent using Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are DoseBox's WhatsApp Order Bot. Extract the customer's intent and medicines they want to order from the following message. If they mention dosage and duration, calculate the total quantity of tablets exactly. Address is optional.
    
    You MUST respond with valid JSON only. Do not wrap it in markdown block quotes. The JSON must exactly follow this structure:
    {
      "intent": "ORDER" | "INQUIRY" | "OTHER",
      "items": [
        { "name": "medicine name", "quantity": 10, "dosage": "BD" }
      ],
      "address": "user address if provided, else null",
      "replyMessage": "A friendly response to the customer based on their query."
    }

    Message: "${message}"`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Gemini output:', text);
      return "Sorry, I couldn't understand your order. Please try again or rephrase it.";
    }

    if (parsed.intent !== 'ORDER' || !parsed.items || parsed.items.length === 0) {
      return parsed.replyMessage || "I'm here to help with your medicine orders!";
    }

    // 3. Match Medicines
    const matchedItems = [];
    let totalAmount = 0;
    const allMedicines = await Medicine.findAll({ attributes: ['id', 'name', 'genericName', 'price', 'discountPrice'] });

    for (const item of parsed.items) {
      let bestMatch = null;
      let highestScore = 0;

      const qName = item.name.toLowerCase();
      for (const m of allMedicines) {
        if (m.name.toLowerCase().includes(qName) || m.genericName.toLowerCase().includes(qName)) {
          bestMatch = m;
          break; // Perfect or direct inclusion match
        }
        
        let score = 0;
        const mName = m.name.toLowerCase();
        if (mName.startsWith(qName)) score = 0.8;
        else if (mName.includes(qName)) score = 0.6;
        
        if (score > highestScore && score > 0.4) {
          highestScore = score;
          bestMatch = m;
        }
      }

      if (bestMatch) {
        const qty = item.quantity || 1;
        const price = bestMatch.discountPrice || bestMatch.price;
        matchedItems.push({
          medicineId: bestMatch.id,
          name: bestMatch.name,
          quantity: qty,
          unitPrice: price,
          subtotal: price * qty
        });
        totalAmount += (price * qty);
      }
    }

    if (matchedItems.length === 0) {
      return "I couldn't find exact matches for the medicines you asked for. A pharmacist will review your request and contact you shortly.";
    }

    // 4. Create Draft Order
    const order = await Order.create({
      userId: user.id,
      status: 'Pending',
      totalAmount: totalAmount,
      discountAmount: 0,
      gstAmount: 0,
      finalAmount: totalAmount,
      shippingAddressId: 1, // Placeholder
      paymentStatus: 'Unpaid',
      paymentMethod: 'COD',
      trackingTimeline: '[]'
    });

    for (const mItem of matchedItems) {
      await OrderItem.create({
        orderId: order.id,
        medicineId: mItem.medicineId,
        quantity: mItem.quantity,
        price: mItem.unitPrice
      });
    }

    // 5. Generate Reply
    let replyText = `Great! I've drafted your order (Draft #${order.id}).\n\nItems found:\n`;
    matchedItems.forEach(mi => {
      replyText += `- ${mi.quantity}x ${mi.name} (₹${mi.subtotal})\n`;
    });
    replyText += `\nTotal Estimate: ₹${totalAmount}\n\nReply YES to confirm your order, or let me know if you need to make changes.`;

    return replyText;

  } catch (error: any) {
    console.error('Process Message Error:', error);
    return "I'm experiencing some technical difficulties right now. Please try again later.";
  }
}
