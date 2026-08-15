import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { parseCurrencyCode } from '@/lib/currencies';
import type { StoreConfigRow, StoreAlerts } from '@/types/admin';

const CONFIG_KEYS = ['store_name', 'store_email', 'currency', 'free_shipping_threshold', 'return_window', 'hero_subtitle', 'hero_title', 'hero_description'];

async function readPayload() {
  const rows = await prisma.setting.findMany({ where: { key: { in: [...CONFIG_KEYS, 'low_stock_alerts', 'new_order_alerts'] } } });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const config: StoreConfigRow[] = [
    { key: 'store_name', label: 'Store Name', value: map.get('store_name') || 'Style Statement by Shakthi', hint: 'Shown in the storefront header and metadata' },
    { key: 'store_email', label: 'Store Email', value: map.get('store_email') || '', hint: 'Used for order notifications and contact form' },
    { key: 'currency', label: 'Currency', value: map.get('currency') || 'INR (₹) - India', hint: 'Currency for pricing and inventory valuation' },
    { key: 'free_shipping_threshold', label: 'Free Shipping Above', value: map.get('free_shipping_threshold') || '', hint: 'Complimentary shipping above this cart value' },
    { key: 'return_window', label: 'Return Window', value: map.get('return_window') || '14 days', hint: 'Return period shown on the PDP and checkout' },
    { key: 'hero_subtitle', label: 'Hero Subtitle', value: map.get('hero_subtitle') || 'Handcrafted in Mumbai', hint: 'Small text above the main headline' },
    { key: 'hero_title', label: 'Hero Title', value: map.get('hero_title') || 'Jewelry with intention, worn daily', hint: 'Main headline on the homepage. Use HTML tags like <i> or <em> for italics.' },
    { key: 'hero_description', label: 'Hero Description', value: map.get('hero_description') || 'Quietly sculpted pieces in gold and gemstone, made to be worn every day and handed down for generations.', hint: 'Supporting text below the main headline' },
  ];
  const alerts: StoreAlerts = { lowStock: map.get('low_stock_alerts') !== 'false', newOrder: map.get('new_order_alerts') !== 'false' };
  return { config, alerts };
}

export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await readPayload());
}

export async function PATCH(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({})) as { config?: StoreConfigRow[]; alerts?: StoreAlerts };
  if (body.config && Array.isArray(body.config)) {
    for (const row of body.config) {
      if (!CONFIG_KEYS.includes(row.key)) continue;
      await prisma.setting.upsert({
        where: { key: row.key },
        update: { value: String(row.value), label: row.label, hint: row.hint },
        create: { key: row.key, value: String(row.value), label: row.label, hint: row.hint },
      });
      if (row.key === 'store_name') {
        await prisma.setting.upsert({
          where: { key: 'shop.name' },
          update: { value: String(row.value) },
          create: { key: 'shop.name', value: String(row.value), label: 'Shop Name', hint: '' },
        });
      }
      if (row.key === 'currency') {
        const code = parseCurrencyCode(String(row.value));
        await prisma.setting.upsert({
          where: { key: 'shop.currencyCode' },
          update: { value: code },
          create: { key: 'shop.currencyCode', value: code, label: 'Currency Code', hint: '' },
        });
      }
    }
  }
  if (body.alerts) {
    await prisma.setting.upsert({ where: { key: 'low_stock_alerts' }, update: { value: String(body.alerts.lowStock) }, create: { key: 'low_stock_alerts', value: String(body.alerts.lowStock) } });
    await prisma.setting.upsert({ where: { key: 'new_order_alerts' }, update: { value: String(body.alerts.newOrder) }, create: { key: 'new_order_alerts', value: String(body.alerts.newOrder) } });
  }
  revalidatePath('/', 'layout');
  revalidatePath('/');
  return NextResponse.json(await readPayload());
}