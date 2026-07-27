export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Medicine } from '@/models';
import { authenticateJWT, authorizeRoles } from '@/middleware/auth';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    const userAuth = await authenticateJWT(req);
    if (userAuth instanceof NextResponse) return userAuth;
    const roleAuth = authorizeRoles(userAuth, 'Admin', 'SuperAdmin', 'Leadership', 'Medico');
    if (roleAuth) return roleAuth;

    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, message: "Please provide an array of messages." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Load medicines once for the whole batch to optimize
    const allMedicines = await Medicine.findAll({ attributes: ['id', 'name', 'genericName', 'price', 'discountPrice'] });
    const results = [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      let intent = 'UNKNOWN';
      let extractedItems: any[] = [];
      let botReply = '';
      let isSuccess = false;
      let matchedItems = [];

      try {
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

        const aiResult = await model.generateContent(prompt);
        let text = aiResult.response.text();
        text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

        let parsed: any;
        try {
          parsed = JSON.parse(text);
          intent = parsed.intent || 'UNKNOWN';
          extractedItems = parsed.items || [];
          botReply = parsed.replyMessage || '';

          if (intent === 'ORDER' && extractedItems.length > 0) {
            // Match Medicines
            let totalAmount = 0;
            for (const item of extractedItems) {
              let bestMatch = null;
              let highestScore = 0;
              const qName = item.name.toLowerCase();

              for (const m of allMedicines) {
                if (m.name.toLowerCase().includes(qName) || m.genericName.toLowerCase().includes(qName)) {
                  bestMatch = m;
                  break;
                }

                // Simple fuzzy match simulation
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
                  name: bestMatch.name,
                  quantity: qty,
                  price: price
                });
                totalAmount += (price * qty);
              }
            }

            if (matchedItems.length === 0) {
              botReply = "I couldn't find exact matches for the medicines you asked for. A pharmacist will contact you shortly to assist.";
              isSuccess = false; // Evaluated as failure if ordered but nothing found
            } else {
              botReply = `Great! I found your items:\n`;
              matchedItems.forEach(mi => {
                botReply += `- ${mi.quantity}x ${mi.name} (₹${mi.price * mi.quantity})\n`;
              });
              botReply += `\nTotal Estimate: ₹${totalAmount}`;
              isSuccess = true;
            }
          } else {
            isSuccess = true; // Non-order intents are usually successful if parsed properly
          }
        } catch (e) {
          botReply = "JSON Parse Error from AI";
          isSuccess = false;
        }
      } catch (err: any) {
        if (err.message && err.message.includes('429')) {
          botReply = "Quota Exceeded (429)";
        } else {
          botReply = "API Error: " + err.message;
        }
        isSuccess = false;
      }

      results.push({
        message,
        intent,
        extractedItems,
        matchedItems,
        reply: botReply,
        success: isSuccess
      });

      // Sleep to prevent hitting quota quickly
      if (i < messages.length - 1) {
        await sleep(1500); // 1.5 second delay between requests
      }
    }

    return NextResponse.json({
      success: true,
      data: results
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
