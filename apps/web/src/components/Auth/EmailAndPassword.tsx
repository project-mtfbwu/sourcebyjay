import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Lock, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export type PasswordAuthPayload = {
  email: string;
  password: string;
  phone?: string;
  fullName?: string;
  otpCode?: string;
};

export const EmailAndPassword = ({
  onSubmit,
  onRequestOtp,
  view,
  isLoading,
  otpLoading,
  className,
  ...buttonProps
}: {
  onSubmit: (data: PasswordAuthPayload) => void;
  onRequestOtp?: (phone: string) => Promise<{ ok: boolean; devCode?: string | null; error?: string }>;
  view: 'sign-in' | 'sign-up';
  isLoading: boolean;
  otpLoading?: boolean;
} & Omit<ComponentProps<typeof Button>, 'children' | 'type'>) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  async function handleSendOtp() {
    if (!onRequestOtp) return;
    setOtpError(null);
    const result = await onRequestOtp(phone);
    if (!result.ok) {
      setOtpError(result.error ?? 'Could not send OTP');
      return;
    }
    setOtpSent(true);
    setDevCode(result.devCode ?? null);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          email,
          password,
          ...(view === 'sign-up' ? { phone, fullName, otpCode } : {}),
        });
      }}
      data-testid="password-form"
    >
      <div className="space-y-4">
        {view === 'sign-up' ? (
          <div>
            <Label htmlFor={`${view}-full-name`} className="text-foreground">
              Full name
            </Label>
            <div className="mt-1">
              <InputGroup>
                <InputGroupInput
                  id={`${view}-full-name`}
                  name="fullName"
                  type="text"
                  disabled={isLoading}
                  value={fullName}
                  placeholder="Your name"
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </InputGroup>
            </div>
          </div>
        ) : null}

        <div>
          <Label htmlFor={`${view}-email`} className="text-foreground">
            Email address
          </Label>
          <div className="mt-1">
            <InputGroup>
              <InputGroupAddon>
                <Mail className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                id={`${view}-email`}
                name="email"
                type="email"
                disabled={isLoading}
                value={email}
                data-strategy="email-password"
                placeholder="email@example.com"
                onChange={(event) => setEmail(event.target.value)}
                autoComplete={'email'}
                required
              />
            </InputGroup>
          </div>
        </div>

        {view === 'sign-up' ? (
          <div>
            <Label htmlFor={`${view}-phone`} className="text-foreground">
              Phone (required)
            </Label>
            <div className="mt-1 flex gap-2">
              <InputGroup className="flex-1">
                <InputGroupAddon>
                  <Phone className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id={`${view}-phone`}
                  name="phone"
                  type="tel"
                  disabled={isLoading || otpSent}
                  value={phone}
                  placeholder="+91 98XXXXXXXX"
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                  required
                />
              </InputGroup>
              {onRequestOtp ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading || otpLoading || phone.trim().length < 8}
                  onClick={() => void handleSendOtp()}
                >
                  {otpLoading ? <Spinner className="h-4 w-4" /> : otpSent ? 'Resend' : 'Send OTP'}
                </Button>
              ) : null}
            </div>
            {otpError ? <p className="mt-1 text-sm text-destructive">{otpError}</p> : null}
            {devCode ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Dev OTP: <strong>{devCode}</strong>
              </p>
            ) : null}
          </div>
        ) : null}

        {view === 'sign-up' && onRequestOtp ? (
          <div>
            <Label htmlFor={`${view}-otp`} className="text-foreground">
              Phone OTP
            </Label>
            <div className="mt-1">
              <InputGroup>
                <InputGroupInput
                  id={`${view}-otp`}
                  name="otpCode"
                  type="text"
                  inputMode="numeric"
                  disabled={isLoading || !otpSent}
                  value={otpCode}
                  placeholder="123456"
                  onChange={(event) => setOtpCode(event.target.value)}
                  required
                  minLength={4}
                  maxLength={8}
                />
              </InputGroup>
            </div>
          </div>
        ) : null}

        <div className="space-y-1">
          <Label htmlFor={`${view}-password`} className="text-foreground">
            Password
          </Label>
          <div className="mt-1">
            <InputGroup>
              <InputGroupAddon>
                <Lock className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                id={`${view}-password`}
                name="password"
                type="password"
                disabled={isLoading}
                value={password}
                placeholder="Type your password"
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  view === 'sign-in' ? 'current-password' : 'new-password'
                }
                required
              />
            </InputGroup>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {view === 'sign-in' ? (
            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-muted-foreground dark:hover:text-gray-600 hover:text-foreground"
              >
                Forgot your password?
              </Link>
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <Button
            {...buttonProps}
            disabled={
              isLoading ||
              buttonProps.disabled ||
              (view === 'sign-up' && !!onRequestOtp && (!otpSent || otpCode.trim().length < 4))
            }
            type="submit"
            className={cn('w-full', className)}
          >
            {isLoading ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                <span>Loading...</span>
              </>
            ) : (
              <span>{view === 'sign-in' ? 'Login' : 'Sign up'}</span>
            )}
          </Button>
          <div className="w-full text-center">
            {view === 'sign-in' ? (
              <div className="text-sm">
                <Link
                  href="/sign-up"
                  className="font-medium text-muted-foreground hover:text-foreground"
                >
                  Don&apos;t have an account? Sign up
                </Link>
              </div>
            ) : (
              <div className="text-sm">
                <Link
                  href="/login"
                  className="font-medium text-muted-foreground hover:text-foreground"
                >
                  Already have an account? Log in
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};
