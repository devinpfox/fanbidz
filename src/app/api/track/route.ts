import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { trackingCode, carrier } = await req.json();
  if (!trackingCode) return NextResponse.json({ error: 'trackingCode required' }, { status: 400 });

  const res = await fetch('https://api.easypost.com/v2/trackers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EASYPOST_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tracker: {
        tracking_code: trackingCode,
        ...(carrier ? { carrier } : {}),
      }
    }),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });
  return NextResponse.json({ id: data.id, status: data.status, est_delivery: data.est_delivery_date, carrier: data.carrier });
}
