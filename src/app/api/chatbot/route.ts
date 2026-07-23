import { NextRequest, NextResponse } from 'next/server';
import { Medicine } from '../../../models';
import { Op } from 'sequelize';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid query' }, { status: 400 });
    }

    const lowerQuery = query.toLowerCase().trim();

    // 1. Generic Conversational QA
    const qaMap: Record<string, string[]> = {
      'how are you': ['how are you', 'how r u', 'how are you doing'],
      'who are you': ['who are you', 'what is your name', 'who r u'],
      'what do you do': ['what do you do', 'how can you help', 'what can you do'],
      'thank you': ['thank you', 'thanks', 'thx'],
      'bye': ['bye', 'goodbye', 'see ya'],
      'what is dosebox': ['what is dosebox', 'about dosebox', 'who is dosebox'],
      'delivery': ['delivery time', 'do you deliver', 'when will i get my order', 'shipping'],
      'prescription': ['is prescription required', 'do i need prescription', 'upload prescription'],
      'how to order': ['how to order', 'how do i buy', 'place order'],
      'payment': ['payment methods', 'how to pay', 'cod available'],
      'refund': ['refund policy', 'return policy', 'can i return'],
      'contact': ['contact support', 'customer care', 'phone number', 'helpdesk'],
      'greeting': ['hi', 'hello', 'hey', 'start', 'good morning', 'good evening']
    };

    const qaResponses: Record<string, string> = {
      'how are you': "I'm just a bot, but I'm doing great! How can I help you with your health needs today?",
      'who are you': "I am the DoseBox Assistant. I can help you search for medicines, check prices, and quickly add them to your cart.",
      'what do you do': "I can help you find any medicine you're looking for! Just type the name of the medicine, and I'll fetch its details for you.",
      'thank you': "You're very welcome! Let me know if you need anything else. 😊",
      'bye': "Goodbye! Stay healthy and take care. 👋",
      'what is dosebox': "DoseBox is India's digital super-specialty pharmacy. We help you save up to 85% on oncology, kidney, transplant, and regular medicines.",
      'delivery': "Yes, we offer fast delivery! Orders are typically delivered within 24-48 hours depending on your location and pincode.",
      'prescription': "Some specialty medicines require a valid prescription. If your medicine needs one, you will be prompted to upload it safely during checkout.",
      'how to order': "It's easy! Just type the name of the medicine right here in the chat, and I'll give you a direct button to add it to your cart.",
      'payment': "We accept Cash on Delivery (COD), UPI (PhonePe, GPay), Credit/Debit cards, and Net Banking.",
      'refund': "We have a hassle-free return policy. You can return unused, sealed medicines within 7 days of delivery for a full refund or DoseBox tokens.",
      'contact': "You can reach our 24/7 support team at support@dosebox.in or call us directly via the 'Contact Us' page.",
      'greeting': "👋 Hi there! I'm the DoseBox Assistant. Enter the name of a medicine, and I'll help you find the best purchase option or recommend suitable alternatives if it's unavailable."
    };

    // Check if query matches any QA intent
    for (const [intent, keywords] of Object.entries(qaMap)) {
      if (keywords.some(kw => lowerQuery.includes(kw))) {
        return NextResponse.json({
          success: true,
          data: {
            type: 'text',
            message: qaResponses[intent]
          }
        });
      }
    }

    // 2. Search for medicine by name
    const medicines = await Medicine.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${lowerQuery}%` } },
          { composition: { [Op.like]: `%${lowerQuery}%` } }
        ]
      },
      limit: 3 // Return top 3 matches to not overwhelm the chat UI
    });

    if (medicines && medicines.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          type: 'medicine',
          message: `I found ${medicines.length} medicine(s) matching your request.`,
          medicines: medicines
        }
      });
    }

    // 3. Not found
    return NextResponse.json({
      success: true,
      data: {
        type: 'text',
        message: `I couldn't find any medicine matching "${query}". Could you please check the spelling or try another name?`
      }
    });

  } catch (error) {
    console.error('Chatbot API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
