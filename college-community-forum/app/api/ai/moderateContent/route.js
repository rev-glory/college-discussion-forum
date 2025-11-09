import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ message: 'Missing text' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ approved: true });
    }

    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'omni-moderation-latest', input: text.slice(0, 5000) })
    });

    if (!res.ok) {
      return NextResponse.json({ approved: true });
    }

    const data = await res.json();
    const result = data?.results?.[0];
    const flagged = result?.flagged || false;
    return NextResponse.json({ approved: !flagged, reason: flagged ? 'Content flagged by moderation.' : undefined });
  } catch (error) {
    return NextResponse.json({ approved: true });
  }
}
