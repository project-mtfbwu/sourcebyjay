import Image from 'next/image';
import Link from 'next/link';
import { type ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-primary/30 via-purple-100 to-pink-100 p-10 lg:flex">
        <Link href="/">
          <Image src="/brand/logo.svg" alt="SourceByJay" width={200} height={44} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">#listingInProgress</h1>
          <p className="mt-4 max-w-md text-lg text-marketplace-muted">
            Your B2B marketplace for verified manufacturers and wholesale sourcing. Join thousands of buyers worldwide.
          </p>
        </div>
        <p className="text-sm text-marketplace-muted">© 2026 SourceByJay</p>
      </div>
      <div className="flex flex-col">
        <header className="flex items-center justify-between border-b p-4 lg:hidden">
          <Link href="/">
            <Image src="/brand/logo.svg" alt="SourceByJay" width={160} height={36} />
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center p-4">{children}</main>
      </div>
    </div>
  );
}
