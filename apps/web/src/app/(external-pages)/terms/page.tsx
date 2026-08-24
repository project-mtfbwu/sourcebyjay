import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-10">
      <h1 className="text-3xl font-bold">Terms of Use</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 23, 2026</p>

      <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
        <p>
          By using SourceByJay, you agree to these terms. If you do not agree, do not use the platform.
        </p>

        <h2>Platform role</h2>
        <p>
          SourceByJay is a marketplace facilitator. We connect buyers and suppliers but are not a party
          to transactions between users unless explicitly stated.
        </p>

        <h2>User accounts</h2>
        <ul>
          <li>You must provide accurate business information</li>
          <li>You are responsible for account security</li>
          <li>Suppliers must comply with verification requirements</li>
        </ul>

        <h2>Prohibited conduct</h2>
        <ul>
          <li>Fraud, misrepresentation, or counterfeit goods</li>
          <li>Spam, scraping, or abuse of RFQ/inquiry systems</li>
          <li>Circumventing platform fees or verification</li>
        </ul>

        <h2>Limitation of liability</h2>
        <p>
          The platform is provided &quot;as is&quot;. We are not liable for disputes between buyers and
          suppliers, product quality, or delivery failures.
        </p>

        <h2>Governing law</h2>
        <p>These terms are governed by applicable law in your jurisdiction of operation.</p>

        <h2>Contact</h2>
        <p>
          Legal inquiries: <a href="mailto:legal@sourcebyjay.com">legal@sourcebyjay.com</a>
        </p>
      </div>

      <Link href="/" className="mt-8 inline-block text-sm text-marketplace-accent hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}

export const metadata = {
  title: 'Terms of Use | SourceByJay',
};
