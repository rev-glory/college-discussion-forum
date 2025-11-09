import { NextResponse } from 'next/server';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export async function POST(request) {
  try {
    const { title, content } = await request.json();
    if (!title && !content) {
      return NextResponse.json({ message: 'Missing title or content' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback: naive tags from keywords
      const base = `${title || ''} ${content || ''}`.toLowerCase();
      const seeds = ['Event','Help','Hackathon','Academic','Clubs','General','Announcements','Project'];
      const tags = seeds.filter(s => base.includes(s.toLowerCase())).slice(0,5);
      return NextResponse.json({ tags });
    }

    const prompt = `Suggest 3-6 concise, relevant tags for the following forum post. Output as a JSON array of strings only (e.g., ["Help","Hackathon"]). Avoid duplicates and special characters.

Title: ${title || ''}
Content: ${content || ''}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You generate clean JSON arrays of relevant tags.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 120,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ message: 'AI service error' }, { status: 502 });
    }

    const data = await res.json();
    const contentText = data?.choices?.[0]?.message?.content || '[]';
    let tags = [];
    try { tags = JSON.parse(contentText); } catch { /* try to recover */
      tags = contentText
        .replace(/\n/g, ' ')
        .replace(/[\[\]]/g,'')
        .split(',')
        .map(s=>s.replace(/"/g,'').trim())
        .filter(Boolean)
        .slice(0,6);
    }
    return NextResponse.json({ tags });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to suggest tags' }, { status: 500 });
  }
}
