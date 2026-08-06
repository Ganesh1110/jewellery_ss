import { Metadata } from 'next';
import Link from 'next/link';
import { PolicyPage } from '@/components/layout/PolicyPage';

export const metadata: Metadata = {
  title: 'Shipping Policy',
};

export default function ShippingPolicyPage() {
  return (
    <PolicyPage title="Shipping Policy" lastUpdated="June 2024">
      <p>We ship handcrafted jewelry worldwide, with care and insurance included on every order.</p>
      <h2>Processing Time</h2>
      <p>Orders are made to order and typically dispatched within 5–7 business days. Pieces that require resizing or engraving may take a little longer. You will receive a tracking number as soon as your order ships.</p>
      <h2>Delivery Times</h2>
      <ul>
        <li><strong>Domestic (India):</strong> 3–6 business days after dispatch.</li>
        <li><strong>International:</strong> 7–14 business days after dispatch, depending on destination and customs clearance.</li>
      </ul>
      <h2>Shipping Costs</h2>
      <p>Complimentary worldwide shipping applies to orders over ₹15,000. Orders below this threshold are charged a flat rate calculated at checkout. Import duties and taxes, where applicable, are collected at checkout for select regions and clearly shown before you confirm your order.</p>
      <h2>Insurance &amp; Signature</h2>
      <p>Every delivery is fully insured and requires a signature upon receipt. If you are not available, our courier will attempt redelivery or hold the package for collection.</p>
      <h2>Questions</h2>
      <p>Need assistance with a delivery? Visit our <Link href="/contact" className="underline">contact page</Link> and our team will help.</p>
    </PolicyPage>
  );
}