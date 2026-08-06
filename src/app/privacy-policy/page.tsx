import { Metadata } from 'next';
import Link from 'next/link';
import { PolicyPage } from '@/components/layout/PolicyPage';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage title="Privacy Policy" lastUpdated="June 2024">
      <p>This Privacy Policy explains how Style Statement by Shakthi (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses, and protects the personal information you share with us when you visit our site or place an order.</p>
      <h2>Information We Collect</h2>
      <p>We collect information you provide directly, such as your name, email address, shipping and billing address, and phone number, when you make a purchase or create an account. We also collect limited technical data such as browser type and device information to improve your experience.</p>
      <h2>How We Use Your Information</h2>
      <p>We use your information to process and fulfil orders, arrange shipping, respond to enquiries, and — with your consent — send you updates about new collections and private sales. We never sell your personal data to third parties.</p>
      <h2>Payments</h2>
      <p>Payments are processed securely by our payment partners. We do not store your full card details on our servers.</p>
      <h2>Your Rights</h2>
      <p>You may request access to, correction of, or deletion of your personal information at any time by contacting us. You may also unsubscribe from marketing emails at any time using the link in each email.</p>
      <h2>Contact</h2>
      <p>If you have any questions about this policy, please reach out via our <Link href="/contact" className="underline">contact page</Link>.</p>
    </PolicyPage>
  );
}