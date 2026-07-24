import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Medicine, User, Order, OrderItem } from '@/models';
import { Op } from 'sequelize';
import { calculateSimilarity } from '@/utils/fuzzyMatch';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, phone, userName } = body;

    if (!message) {
      return NextResponse.json({ success: false, reply: "Please send a message with your order." }, { status: 400 });
    }

    // 1. Identify User
    let user = await User.findOne({ where: { phone: phone || 'unknown' } });
    if (!user && phone) {
      // In a real scenario we'd create a stub user or require registration
      // For this prototype, we'll try to find any admin to attach the order if user is not found, or just create a stub user
      user = await User.create({
        name: userName || 'WhatsApp Customer',
        phone,
        email: `wa_${Date.now()}@example.com`,
        password: 'whatsapp_generated',
        roleId: 2, // Assuming 2 is Customer Role
        status: 'active'
      });
    }

    // 2. Parse Intent using Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `You are DoseBox's WhatsApp Order Bot. Extract the customer's intent and medicines they want to order from the following message. If they mention dosage and duration (e.g., 30 days BD), calculate the total quantity of tablets exactly. Address is optional.
    
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
      return NextResponse.json({ success: false, reply: "Sorry, I couldn't understand your order. Please try again." });
    }

    if (parsed.intent !== 'ORDER' || !parsed.items || parsed.items.length === 0) {
      return NextResponse.json({ success: true, reply: parsed.replyMessage });
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
        // Simple fallback matching
        if (m.name.toLowerCase().includes(qName) || m.genericName.toLowerCase().includes(qName)) {
          bestMatch = m;
          break;
        }

        // Or if calculateSimilarity exists, use it
        const nameScore = calculateSimilarity ? calculateSimilarity(qName, m.name.toLowerCase()) : 0;
        const genScore = calculateSimilarity ? calculateSimilarity(qName, m.genericName.toLowerCase()) : 0;
        const score = Math.max(nameScore, genScore);

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
      return NextResponse.json({
        success: true,
        reply: "I couldn't find exact matches for the medicines you asked for. A pharmacist will contact you shortly to assist.",
        parsed
      });
    }

    // 4. Create Draft Order (if user exists)
    let orderId = null;
    if (user && user.id) {
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
      orderId = order.id;
    }

    // 5. Generate Reply
    let replyText = `Great! I've drafted your order (Draft #${orderId || 'New'}).\n\nItems found:\n`;
    matchedItems.forEach(mi => {
      replyText += `- ${mi.quantity}x ${mi.name} (₹${mi.subtotal})\n`;
    });
    replyText += `\nTotal Estimate: ₹${totalAmount}\n\nReply YES to confirm your order, or let me know if you need to make changes.`;

    return NextResponse.json({
      success: true,
      reply: replyText,
      data: {
        orderId,
        matchedItems,
        totalAmount,
        parsed
      }
    });

  } catch (error: any) {
    console.error('WhatsApp Bot Error:', error);
    return NextResponse.json({ success: false, reply: "I'm experiencing some technical difficulties right now. Please try again later." }, { status: 500 });
  }
}
