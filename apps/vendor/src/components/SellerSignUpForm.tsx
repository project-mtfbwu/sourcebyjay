'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_FORM_FIELDS,
  fieldMode,
  visibleFormFields,
  type FormFieldConfig,
} from '@sourcebyjay/types';
import { LocationFields } from '@/components/LocationFields';
import { requestSellerPhoneOtp, sellerSignUpAction } from '@/lib/actions';

export function SellerSignUpForm({
  fieldConfigs = DEFAULT_FORM_FIELDS,
}: {
  fieldConfigs?: FormFieldConfig[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const configs = fieldConfigs?.length ? fieldConfigs : DEFAULT_FORM_FIELDS;
  const fields = useMemo(() => visibleFormFields(configs, 'seller'), [configs]);

  function mode(key: string) {
    return fieldMode(configs, 'seller', key);
  }
  function show(key: string) {
    return mode(key) !== 'hidden';
  }
  function required(key: string) {
    return mode(key) === 'required';
  }

  function onSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const nextPhone = String(fd.get('phone') ?? '');
    startTransition(async () => {
      const result = await requestSellerPhoneOtp(nextPhone);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPhone(nextPhone);
      setDevCode(result.devCode);
      setOtpSent(true);
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get('email') ?? ''),
      password: String(fd.get('password') ?? ''),
      fullName: String(fd.get('fullName') ?? ''),
      phone,
      otpCode: String(fd.get('otpCode') ?? ''),
      companyName: String(fd.get('companyName') ?? ''),
      country: String(fd.get('country') ?? 'India'),
      state: String(fd.get('state') ?? ''),
      city: String(fd.get('city') ?? ''),
      gstin: String(fd.get('gstin') ?? ''),
      mainProducts: String(fd.get('mainProducts') ?? ''),
      description: String(fd.get('description') ?? ''),
    };

    startTransition(async () => {
      const result = await sellerSignUpAction(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push('/');
      router.refresh();
    });
  }

  if (!otpSent) {
    return (
      <form onSubmit={onSendOtp} className="card form-section-card" style={{ marginTop: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Create seller account</h2>
        <p className="muted" style={{ margin: 0 }}>
          Separate from buyer accounts. First we verify your phone (local OTP = 123456).
        </p>
        <div className="form-grid">
          {show('phone') ? (
            <label className="span-2">
              Phone {required('phone') ? '*' : ''}
              <input name="phone" type="tel" required={required('phone')} minLength={8} placeholder="+91…" />
            </label>
          ) : null}
        </div>
        {error ? <p className="denied">{error}</p> : null}
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send phone OTP'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card form-section-card" style={{ marginTop: '1.5rem' }}>
      <h2 style={{ margin: 0 }}>Create seller account</h2>
      <p className="muted" style={{ margin: 0 }}>
        Enter the OTP, then complete your seller profile.
        {devCode ? (
          <>
            {' '}
            <strong>Dev code: {devCode}</strong>
          </>
        ) : null}
      </p>

      <div className="form-grid">
        {show('full_name') ? (
          <label>
            {fields.find((f) => f.fieldKey === 'full_name')?.label ?? 'Full name'}
            {required('full_name') ? ' *' : ''}
            <input name="fullName" required={required('full_name')} minLength={2} />
          </label>
        ) : null}
        {show('email') ? (
          <label>
            Work email *
            <input name="email" type="email" required autoComplete="email" />
          </label>
        ) : null}
        <label>
          Phone *
          <input name="phone" type="tel" value={phone} readOnly required />
        </label>
        <label>
          OTP code *
          <input name="otpCode" required minLength={4} maxLength={8} placeholder="123456" />
        </label>
        {show('password') ? (
          <label>
            Password * (min 8)
            <input name="password" type="password" required minLength={8} autoComplete="new-password" />
          </label>
        ) : null}
        {show('company_name') ? (
          <label>
            Company name {required('company_name') ? '*' : ''}
            <input name="companyName" required={required('company_name')} minLength={2} />
          </label>
        ) : null}
        {show('gstin') ? (
          <label>
            GSTIN {required('gstin') ? '*' : ''}
            <input
              name="gstin"
              required={required('gstin')}
              minLength={required('gstin') ? 10 : undefined}
              maxLength={20}
              placeholder="22AAAAA0000A1Z5"
            />
          </label>
        ) : null}
        {show('country') || show('city') ? (
          <LocationFields
            defaultCountry="India"
            countryRequired={required('country')}
            stateRequired
            cityRequired={required('city')}
          />
        ) : null}
        {show('main_products') ? (
          <label className="span-2">
            Main products {required('main_products') ? '*' : ''}
            <input
              name="mainProducts"
              required={required('main_products')}
              minLength={2}
              placeholder="Apparel, electronics…"
            />
          </label>
        ) : null}
        {show('description') ? (
          <label className="span-2">
            Company description {required('description') ? '*' : '(optional)'}
            <textarea name="description" rows={3} required={required('description')} />
          </label>
        ) : null}
      </div>

      {error ? <p className="denied">{error}</p> : null}

      <button className="btn" type="submit" disabled={pending}>
        {pending ? 'Creating…' : 'Create seller account'}
      </button>
    </form>
  );
}
