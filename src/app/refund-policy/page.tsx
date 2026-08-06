import { Metadata } from 'next';
import Link from 'next/link';
import { PolicyPage } from '@/components/layout/PolicyPage';

export const metadata: Metadata = {
  title: 'Refund Policy',
};

export default function RefundPolicyPage() {
  return (
    <PolicyPage title="Refund Policy" lastUpdated="June 2024">
      <p>We want you to love your piece. If it isn&apos;t quite right, you may return unworn jewelry within 14 days of delivery for a refund or exchange.</p>
      <h2>Eligibility</h2>
      <p>To be eligible for a return, items must be unworn, undamaged, and returned in their original packaging with all certificates and tags intact. Custom, engraved, and made-to-order pieces are final sale and cannot be returned unless defective.</p>
      <h2>How to Start a Return</h2>
      <p>Contact our team via the <Link href="/contact" className="underline">contact page</Link> within 14 days of delivery. We will share a prepaid return label and guide you through packaging your item securely.</p>
      <h2>Refunds</h2>
      <p>Once we receive and inspect your return, we will issue a refund to your original payment method within 5–7 business days. Original shipping costs are non-refundable. Exchanges are shipped to you free of charge.</p>
      <h2>Damaged or Incorrect Items</h2>
      <p>If your order arrives damaged or incorrect, please contact us within 48 hours of delivery with photos, and we will make it right at no cost to you.</p>
      <h2>Questions</h2>
      <p>More questions about returns? Reach out via our <Link href="/contact" className="underline">contact page</Link>.</p>
    </PolicyPage>
  );
}