import Link from 'next/link';
import { MessageCircle, ClipboardList, Headphones } from 'lucide-react';

export function FloatAside() {
  const items = [
    { icon: MessageCircle, label: 'Messenger' },
    { icon: Headphones, label: 'Support' },
    { icon: ClipboardList, label: 'Survey' },
  ];

  return (
    <aside className="fixed bottom-24 right-4 z-40 hidden flex-col overflow-hidden rounded-lg bg-white shadow-lg lg:flex">
      {items.map((item, i) => (
        <button
          key={item.label}
          type="button"
          className={`flex w-[90px] flex-col items-center gap-1 px-2 py-3 text-xs text-marketplace-muted hover:bg-muted hover:text-foreground ${
            i < items.length - 1 ? 'border-b border-marketplace-border' : ''
          }`}
        >
          <item.icon className="size-6" />
          <span>{item.label}</span>
        </button>
      ))}
    </aside>
  );
}

export function MarketplaceFooter() {
  const columns = [
    {
      title: 'About SourceByJay',
      links: ['Why choose SourceByJay', 'Co-Create Pitch', 'Corporate responsibility', 'Careers'],
    },
    {
      title: 'Order protection',
      links: ['Secure payments', 'Money-back guarantee', 'On-time delivery', 'After-sales protections'],
    },
    {
      title: 'Source on SourceByJay',
      links: ['Verified manufacturers', 'Request for Quotation'],
    },
    {
      title: 'Help Center',
      links: ['Buyer Help Center', 'Live chat', 'File a trade dispute', 'Refunds'],
    },
    {
      title: 'Sell on SourceByJay',
      links: ['Sell on SourceByJay', 'Start selling', 'Check order status', 'Become a Verified Supplier'],
    },
  ];

  return (
    <footer className="mt-auto border-t border-marketplace-border bg-[#f5f5f5]">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 lg:grid-cols-5 lg:px-10">
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 text-sm font-semibold">{col.title}</h3>
            <ul className="space-y-2 text-sm text-marketplace-muted">
              {col.links.map((link) => (
                <li key={link}>
                  <Link href="#" className="hover:text-foreground">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-marketplace-border bg-white py-6 text-center text-xs text-marketplace-muted">
        <p>© 2026 SourceByJay. All rights reserved.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link href="/terms">Legal Notice</Link>
          <span>·</span>
          <Link href="/privacy">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms">Terms of Use</Link>
        </div>
      </div>
    </footer>
  );
}
