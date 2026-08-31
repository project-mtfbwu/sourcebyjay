'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { Camera, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { recordSearch } from '@/lib/search-history';

type Suggestion = {
  type: 'product' | 'supplier' | 'query';
  label: string;
  href: string;
};

type SearchMode = 'products' | 'suppliers' | 'ai';

interface SearchBarProps {
  defaultValue?: string;
  variant?: 'hero' | 'compact';
  /** Default search mode when submitting */
  defaultMode?: SearchMode;
}

export function SearchBar({
  defaultValue = '',
  variant = 'hero',
  defaultMode = 'products',
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [mode, setMode] = useState<SearchMode>(defaultMode);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2 || mode === 'ai') {
      setSuggestions([]);
      return;
    }
    const handle = window.setTimeout(() => {
      setLoading(true);
      void fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data: { suggestions?: Suggestion[] }) => {
          setSuggestions(data.suggestions ?? []);
          setOpen(true);
        })
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 220);
    return () => window.clearTimeout(handle);
  }, [query, mode]);

  function pushProductSearch(params: URLSearchParams) {
    router.push(`/search?${params.toString()}`);
    setOpen(false);
  }

  function goSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const q = query.trim();
    if (!q && mode !== 'ai') {
      pushProductSearch(new URLSearchParams({ mode: mode === 'suppliers' ? 'suppliers' : 'products' }));
      return;
    }

    if (mode === 'ai') {
      if (q.length < 2) {
        toast.error('Describe what you want to source');
        return;
      }
      startTransition(async () => {
        try {
          const res = await fetch('/api/search/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q }),
          });
          const data = (await res.json()) as {
            q?: string;
            moq?: number;
            minPrice?: number;
            maxPrice?: number;
            country?: string;
            mode?: string;
            fallback?: boolean;
            error?: string;
          };
          if (!res.ok) {
            // Soft fallback — never show raw provider errors (e.g. Groq JSON validation)
            toast.message('AI busy — searching with your words instead');
            const params = new URLSearchParams();
            params.set('q', q);
            params.set('mode', 'products');
            params.set('ai', '1');
            params.set('aiFallback', '1');
            pushProductSearch(params);
            return;
          }
          const keywords = (data.q ?? q).trim();
          if (keywords) recordSearch(keywords);
          const params = new URLSearchParams();
          params.set('q', keywords);
          params.set('mode', data.mode === 'suppliers' ? 'suppliers' : 'products');
          params.set('ai', '1');
          if (data.fallback) params.set('aiFallback', '1');
          if (data.moq) params.set('moq', String(data.moq));
          if (data.minPrice != null) params.set('minPrice', String(data.minPrice));
          if (data.maxPrice != null) params.set('maxPrice', String(data.maxPrice));
          if (data.country) params.set('country', data.country);
          pushProductSearch(params);
        } catch {
          toast.error('AI search unavailable — try keyword search');
        }
      });
      return;
    }

    if (q) recordSearch(q);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('mode', mode === 'suppliers' ? 'suppliers' : 'products');
    pushProductSearch(params);
  }

  function onImagePicked(file: File | null) {
    if (!file) return;
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set('file', file);
        const res = await fetch('/api/search/image', { method: 'POST', body: fd });
        const data = (await res.json()) as {
          q?: string;
          fallback?: boolean;
          error?: string;
        };
        if (!res.ok || !data.q) {
          toast.error(data.error ?? 'Could not search by image');
          return;
        }
        recordSearch(data.q);
        const params = new URLSearchParams();
        params.set('q', data.q);
        params.set('mode', 'products');
        params.set('image', '1');
        if (data.fallback) params.set('aiFallback', '1');
        pushProductSearch(params);
        toast.success(`Searching for “${data.q}”`);
      } catch {
        toast.error('Image search failed');
      }
    });
  }

  const dropdown =
    open && mode !== 'ai' && (suggestions.length > 0 || loading) ? (
      <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border border-marketplace-border bg-white py-1 shadow-lg">
        {loading && suggestions.length === 0 ? (
          <li className="px-3 py-2 text-sm text-marketplace-muted">Searching…</li>
        ) : null}
        {suggestions.map((s) => (
          <li key={`${s.type}-${s.href}`}>
            <Link
              href={s.href}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              onClick={() => {
                if (s.type === 'query') recordSearch(query.trim());
                setOpen(false);
              }}
            >
              <span className="w-16 shrink-0 text-[10px] uppercase text-marketplace-muted">
                {s.type}
              </span>
              <span className="truncate">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    ) : null;

  const modeTabs = (
    <div className="mb-2 flex flex-wrap items-center gap-4 text-sm">
      {(
        [
          { id: 'ai' as const, label: 'AI Mode', sparkle: true },
          { id: 'products' as const, label: 'Products', sparkle: false },
          { id: 'suppliers' as const, label: 'Suppliers', sparkle: false },
        ] as const
      ).map((tab) => {
        const active = mode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`relative pb-1 font-medium ${
              active
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#ff6600]'
                : 'text-marketplace-muted hover:text-foreground'
            }`}
          >
            {tab.sparkle ? (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="size-3.5 text-[#ff6600]" />
                {tab.label}
              </span>
            ) : (
              tab.label
            )}
          </button>
        );
      })}
    </div>
  );

  const cameraInput = (
    <input
      ref={fileRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0] ?? null;
        e.target.value = '';
        onImagePicked(f);
      }}
    />
  );

  if (variant === 'compact') {
    return (
      <div ref={boxRef} className="relative flex-1">
        {cameraInput}
        <form onSubmit={goSearch} className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Image search"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            <Camera className="size-4" />
          </Button>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder={
              mode === 'ai' ? 'Describe what you want to source…' : 'Search products or suppliers…'
            }
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={pending}>
            <Search className="size-4" />
          </Button>
        </form>
        {dropdown}
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      {cameraInput}
      {modeTabs}
      <form
        onSubmit={goSearch}
        className="marketplace-search-shadow overflow-hidden rounded-2xl bg-white p-4"
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={
            mode === 'ai'
              ? 'e.g. wireless earbuds MOQ under 100 for a boutique…'
              : 'What are you looking for?'
          }
          className="mb-3 border-0 bg-transparent text-base shadow-none focus-visible:ring-0"
          autoComplete="off"
        />
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-marketplace-border px-4 py-3 text-sm text-marketplace-muted hover:bg-muted disabled:opacity-50"
            title="Upload a product photo (Alibaba Image Search)"
          >
            <Camera className="size-5" />
            <span className="hidden sm:inline">{pending ? 'Working…' : 'Image Search'}</span>
          </button>
          <Button
            type="submit"
            disabled={pending}
            className="rounded-full bg-marketplace-accent px-8 py-6 text-base hover:bg-marketplace-accent/90"
          >
            {mode === 'ai' ? (
              <Sparkles className="mr-2 size-5" />
            ) : (
              <Search className="mr-2 size-5" />
            )}
            {pending ? 'Searching…' : 'Search'}
          </Button>
        </div>
      </form>
      {dropdown}
    </div>
  );
}
