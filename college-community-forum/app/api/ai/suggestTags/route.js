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
      // Fallback: naive tags from keywords, then normalize for display
      const base = `${title || ''} ${content || ''}`.toLowerCase();
      const seeds = ['Event','Help','Hackathon','Academic','Clubs','General','Announcements','Project'];
      const picked = seeds.filter(s => base.includes(s.toLowerCase())).slice(0,5);
      const clean = Array.from(new Set(
        picked.map(t => t)
          .map(t => t.replace(/[\[\]{}()]/g, ''))
          .map(t => t.replace(/[#"'`]/g, ''))
          .map(t => t.replace(/\s+/g, ' ').trim())
          .map(t => t.replace(/[^a-zA-Z0-9\- ]/g, ''))
          .map(t => t.slice(0, 30))
          .filter(Boolean)
      ));
      return NextResponse.json({ tags: clean });
    }

    const prompt = `Suggest 3-6 concise, relevant tags for the following forum post. Output as a JSON array of strings only (e.g., [\"Help\",\"Hackathon\"]). Avoid duplicates and special characters.\n\nTitle: ${title || ''}\nContent: ${content || ''}`;

    const res = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      generationConfig: { temperature: 0.2, maxOutputTokens: 120 },
    });

    const contentText = (typeof res.text === 'string' ? res.text : '[]');
    let tags = [];

    // Prefer content inside a fenced block if present
    let candidate = contentText;
    const fence = contentText.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence && fence[1]) candidate = fence[1].trim();

    try {
      tags = JSON.parse(candidate);
    } catch {
      // Try to salvage a bracketed JSON array substring
      const arrMatch = candidate.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        try { tags = JSON.parse(arrMatch[0]); } catch {}
      }
      if (!Array.isArray(tags) || !tags.length) {
        // Fallback: split common separators when AI returns plain text
        tags = candidate
          .replace(/[\[\]{}]/g,'')
          .split(/[,\n;]+/)
          .map(s=>s.replace(/\"|\'|#/g,'').trim())
          .filter(Boolean);
      }
    }

    // Normalize for frontend display: explode, trim, de-quote, remove odd chars, dedupe, cap length/count
    const clean = Array.from(new Set(
      (Array.isArray(tags) ? tags : [])
        .flatMap(t => (typeof t === 'string' ? t : String(t)).split(/[\n,;]+/))
        .map(t => t.replace(/```\s*json\s*|```/gi, ''))
        .map(t => t.replace(/[#"'`]/g, ''))
        .map(t => t.replace(/[\[\]{}()]/g, ''))
        .map(t => t.replace(/\s+/g, ' ').trim())
        .filter(t => t.toLowerCase() !== 'json')
        .map(t => t.replace(/[^a-zA-Z0-9\- ]/g, ''))
        .map(t => t.slice(0, 30))
        .filter(Boolean)
        .map(t => t.trim().replace(/^[-\s]+|[-\s]+$/g, ''))
        .filter(Boolean)
        .slice(0, 10)
    ));

    return NextResponse.json({ tags: clean });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to suggest tags' }, { status: 500 });
  }
}
