import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ai = new GoogleGenAI({});

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ message: 'Missing text' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Graceful fallback: echo text
      return NextResponse.json({ improvedText: text });
    }

    const prompt = `You are a helpful writing assistant for a college forum. Improve the following text for clarity, grammar, and tone. Keep the original meaning. Return only the improved text without quotes.\n\nText:\n${text}`;

    const res = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
    });

    const improvedText = (typeof res.text === 'string' ? res.text : '').trim() || text;
    return NextResponse.json({ improvedText });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to improve text' }, { status: 500 });
  }
}
