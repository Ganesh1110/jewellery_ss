import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || req.headers.get('x-webhook-signature');
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET;

    // In production, require signature verification if secret is configured
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody || '{}');
    const event = payload.event || payload.type;
    const entity = payload.payload?.payment?.entity || payload.data?.object || payload;

    // Handle payment capture / success
    if (event === 'payment.captured' || event === 'charge.successful' || event === 'payment_intent.succeeded') {
      const orderNumber = entity.notes?.orderNumber || entity.metadata?.orderNumber;
      const paymentId = entity.id;

      if (orderNumber) {
        await prisma.order.updateMany({
          where: { orderNumber },
          data: {
            status: 'Processing',
            notes: `Paid online via gateway. Ref ID: ${paymentId}`,
          },
        });
      }
    } else if (event === 'payment.failed') {
      const orderNumber = entity.notes?.orderNumber || entity.metadata?.orderNumber;
      if (orderNumber) {
        await prisma.order.updateMany({
          where: { orderNumber },
          data: {
            status: 'Payment Failed',
            notes: `Payment attempt failed: ${entity.error_description || 'Gateway declined'}`,
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
