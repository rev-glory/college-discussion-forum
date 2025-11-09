import { NextResponse } from 'next/server';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ message: 'Missing text' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Graceful fallback: echo text
      return NextResponse.json({ improvedText: text });
    }

    const prompt = `You are a helpful writing assistant for a college forum. Improve the following text for clarity, grammar, and tone. Keep the original meaning. Return only the improved text without quotes.

Text:
${text}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You improve writing for clarity, grammar, and friendly tone.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ message: 'AI service error' }, { status: 502 });
    }

    const data = await res.json();
    const improvedText = data?.choices?.[0]?.message?.content?.trim() || text;
    return NextResponse.json({ improvedText });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to improve text' }, { status: 500 });
  }
}
