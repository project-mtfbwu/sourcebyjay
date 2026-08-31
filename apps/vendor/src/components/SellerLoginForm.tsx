'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sellerSignInAction } from '@/lib/actions';

export function SellerLoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') ?? '');
    const password = String(fd.get('password') ?? '');

    startTransition(async () => {
      const result = await sellerSignInAction(email, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push('/');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card" style={{ marginTop: '1.5rem' }}>
      <label>
        Seller email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label style={{ display: 'block', marginTop: '0.75rem' }}>
        Password
        <input name="password" type="password" required autoComplete="current-password" />
      </label>
      {error ? (
        <p className="denied" style={{ marginTop: '1rem' }}>
          {error}
        </p>
      ) : null}
      <button className="btn" type="submit" disabled={pending} style={{ marginTop: '1.25rem' }}>
        {pending ? 'Signing in…' : 'Seller login'}
      </button>
    </form>
  );
}
