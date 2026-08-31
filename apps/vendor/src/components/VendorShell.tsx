'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { VendorNav } from '@/components/VendorNav';

const STORAGE_KEY = 'sbj-vendor-sidebar-collapsed';

function initialFrom(email?: string | null, company?: string | null) {
  const s = (company ?? email ?? 'S').trim();
  return s.charAt(0).toUpperCase();
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      {collapsed ? (
        <path d="M13 12h5M16 9.5 18.5 12 16 14.5" />
      ) : (
        <path d="M18 12h-5M15 9.5 12.5 12 15 14.5" />
      )}
    </svg>
  );
}

export function VendorShell({
  children,
  email,
  companyName,
  verificationTier,
  title,
  subtitle,
  hideHeader,
}: {
  children: React.ReactNode;
  email?: string | null;
  companyName?: string | null;
  verificationTier?: string | null;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
}) {
  const label = companyName?.trim() || email?.split('@')[0] || 'Seller';
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className={`crm${collapsed ? ' is-collapsed' : ''}${ready ? ' is-ready' : ''}`}>
      <aside className="crm-sidebar" aria-label="Seller navigation">
        <div className="crm-brand">
          <strong>{collapsed ? 'SBJ' : 'SourceByJay'}</strong>
          {!collapsed ? <span className="muted">Seller Central</span> : null}
        </div>
        <VendorNav collapsed={collapsed} />
        <div className="crm-sidebar-foot">
          {!collapsed ? (
            <>
              <p className="muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                {email ?? 'Seller'}
                <br />
                <strong style={{ color: 'var(--ink)' }}>{verificationTier ?? 'unverified'}</strong>
              </p>
              <Link href="/login" className="muted" style={{ fontSize: '0.8rem' }}>
                Switch account
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="crm-nav-link"
              title="Switch account"
              aria-label="Switch account"
            >
              <span className="crm-avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                {initialFrom(email, companyName)}
              </span>
            </Link>
          )}
        </div>
      </aside>
      <div className="crm-main">
        <div className="crm-topbar">
          <button
            type="button"
            className="crm-collapse-btn"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
          <div className="crm-topbar-spacer" />
          <div className="crm-topbar-meta">
            <strong>{label}</strong>
            <span className="muted" style={{ fontSize: '0.75rem' }}>
              Seller · :3001
            </span>
          </div>
          <div className="crm-avatar">{initialFrom(email, companyName)}</div>
        </div>
        <div className="crm-body">
          {!hideHeader && title ? (
            <header className="crm-header">
              <div>
                <h1 style={{ margin: 0 }}>{title}</h1>
                {subtitle ? (
                  <p className="muted" style={{ margin: '0.35rem 0 0' }}>
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </header>
          ) : null}
          <div className="crm-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function VendorDenied({ message }: { message?: string }) {
  return (
    <div className="shell">
      <div className="card denied">{message ?? 'Seller access required.'}</div>
      <p className="muted" style={{ marginTop: '1rem' }}>
        <Link href="/login">Seller login</Link>
        {' · '}
        <Link href="/signup">Create seller account</Link>
      </p>
    </div>
  );
}
