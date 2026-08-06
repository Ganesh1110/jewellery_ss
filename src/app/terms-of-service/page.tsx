import { Metadata } from 'next';
import Link from 'next/link';
import { PolicyPage } from '@/components/layout/PolicyPage';

export const metadata: Metadata = {
  title: 'Terms of Service',
};

export default function TermsOfServicePage() {
  return (
    <PolicyPage title="Terms of Service" lastUpdated="June 2024">
      <p>These Terms of Service govern your use of the Style Statement by Shakthi website and your purchase of our products. By accessing our site or placing an order, you agree to these terms.</p>
      <h2>Products &amp; Pricing</h2>
      <p>All products are subject to availability. We make every effort to display accurate prices and descriptions, but errors may occur. We reserve the right to correct pricing errors and update product details at any time.</p>
      <h2>Orders</h2>
      <p>We may refuse or cancel any order for reasons including but not limited to product availability, inaccuracies in pricing, or suspected fraud. When we cancel an order after payment, we will issue a full refund to the original payment method.</p>
      <h2>Care &amp; Certifications</h2>
      <p>Jewelry requires gentle care; please refer to our care guides. Diamonds and gemstones are accompanied by the certifications provided at the time of purchase. Certificates are issued by independent laboratories and are non-returnable.</p>
      <h2>Intellectual Property</h2>
      <p>All content on this site, including text, images, and designs, is the property of Style Statement by Shakthi and may not be reproduced without our written permission.</p>
      <h2>Limitation of Liability</h2>
      <p>To the fullest extent permitted by law, Style Statement by Shakthi shall not be liable for any indirect, incidental, or consequential damages arising from your use of the site or purchase of our products.</p>
      <h2>Contact</h2>
      <p>Questions about these terms? Reach us via our <Link href="/contact" className="underline">contact page</Link>.</p>
    </PolicyPage>
  );
}