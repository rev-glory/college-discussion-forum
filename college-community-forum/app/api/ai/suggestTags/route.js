import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const ai = new GoogleGenAI({});

export async function POST(request) {
  try {
    const { title, content } = await request.json();
    if (!title && !content) {
      return NextResponse.json({ message: 'Missing title or content' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback: naive tags from keywords
      const base = `${title || ''} ${content || ''}`.toLowerCase();
      const seeds = ['Event','Help','Hackathon','Academic','Clubs','General','Announcements','Project'];
      const tags = seeds.filter(s => base.includes(s.toLowerCase())).slice(0,5);
      return NextResponse.json({ tags });
    }

    const prompt = `Suggest 3-6 concise, relevant tags for the following forum post. Output as a JSON array of strings only (e.g., [\"Help\",\"Hackathon\"]). Avoid duplicates and special characters.\n\nTitle: ${title || ''}\nContent: ${content || ''}`;

    const res = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      generationConfig: { temperature: 0.2, maxOutputTokens: 120 },
    });

    const contentText = (typeof res.text === 'string' ? res.text : '[]');
    let tags = [];
    try { tags = JSON.parse(contentText); } catch {
      tags = contentText
        .replace(/\n/g, ' ')
        .replace(/[\[\]]/g,'')
        .split(',')
        .map(s=>s.replace(/\"/g,'').trim())
        .filter(Boolean)
        .slice(0,6);
    }
    return NextResponse.json({ tags });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to suggest tags' }, { status: 500 });
  }
}
