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
      return NextResponse.json({ approved: true });
    }

    const prompt = `You are a strict content moderator for a college forum. Analyze the following text for policy violations (hate, harassment, sexual content with minors, extreme violence, self-harm instructions, and spam). Respond ONLY with compact JSON: {\"flagged\": true|false}.\n\nText:\n${text.slice(0,5000)}`;

    const res = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      generationConfig: { temperature: 0, maxOutputTokens: 20 },
      safetySettings: [],
    });

    let flagged = false;
    try {
      const out = typeof res.text === 'string' ? res.text : '{}';
      const j = JSON.parse(out);
      flagged = !!j.flagged;
    } catch {}

    return NextResponse.json({ approved: !flagged, reason: flagged ? 'Content flagged by moderation.' : undefined });
  } catch (error) {
    return NextResponse.json({ approved: true });
  }
}
