import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 lg:px-10">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 23, 2026</p>

      <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert">
        <p>
          SourceByJay (&quot;we&quot;, &quot;us&quot;) operates a B2B marketplace connecting buyers with
          suppliers. This policy describes how we collect, use, and protect your information.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>Account details: name, email, company name, country, phone</li>
          <li>Business activity: RFQs, inquiries, orders, messages with suppliers</li>
          <li>Technical data: IP address, browser type, usage logs</li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>Provide marketplace services and facilitate B2B transactions</li>
          <li>Verify suppliers and maintain platform trust</li>
          <li>Improve security, prevent fraud, and comply with law</li>
        </ul>

        <h2>Data storage</h2>
        <p>
          Data is stored securely using Supabase (PostgreSQL) with row-level security. We do not sell
          your personal information to third parties.
        </p>

        <h2>Your rights</h2>
        <p>
          You may request access, correction, or deletion of your data by contacting us. EU/UK users
          have additional rights under GDPR.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy questions: <a href="mailto:privacy@sourcebyjay.com">privacy@sourcebyjay.com</a>
        </p>
      </div>

      <Link href="/" className="mt-8 inline-block text-sm text-marketplace-accent hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}

export const metadata = {
  title: 'Privacy Policy | SourceByJay',
};
