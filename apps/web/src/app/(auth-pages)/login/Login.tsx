'use client';
import { Email } from '@/components/Auth/Email';
import { EmailAndPassword } from '@/components/Auth/EmailAndPassword';
import { EmailConfirmationPendingCard } from '@/components/Auth/EmailConfirmationPendingCard';
import { RedirectingPleaseWaitCard } from '@/components/Auth/RedirectingPleaseWaitCard';
import { RenderProviders } from '@/components/Auth/RenderProviders';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  signInWithMagicLinkAction,
  signInWithProviderAction,
} from '@/data/auth/auth';
import { createClient } from '@/supabase-clients/client';
import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import ShinyText from '@/components/ShinyText';

export function Login({
  next,
  authError,
}: {
  next?: string;
  authError?: 'staff_account' | 'seller_account';
}) {
  const [emailSentSuccessMessage, setEmailSentSuccessMessage] = useState<
    string | null
  >(null);
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const toastRef = useRef<string | number | undefined>(undefined);

  const router = useRouter();

  const { execute: executeMagicLink, status: magicLinkStatus } = useAction(
    signInWithMagicLinkAction,
    {
      onExecute: () => {
        toastRef.current = toast.loading('Sending magic link...');
      },
      onSuccess: () => {
        toast.success('A magic link has been sent to your email!', {
          id: toastRef.current,
        });
        toastRef.current = undefined;
        setEmailSentSuccessMessage('A magic link has been sent to your email!');
      },
      onError: ({ error }) => {
        const errorMessage =
          error.serverError ?? 'Failed to send magic link. Try again.';
        toast.error(errorMessage, {
          id: toastRef.current,
        });
        toastRef.current = undefined;
      },
    },
  );

  const { execute: executeProvider, status: providerStatus } = useAction(
    signInWithProviderAction,
    {
      onExecute: () => {
        toastRef.current = toast.loading('Requesting login...');
      },
      onSuccess: (payload) => {
        toast.success('Redirecting...', {
          id: toastRef.current,
        });
        toastRef.current = undefined;
        window.location.href = payload.data?.url || '/';
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? 'Failed to login', {
          id: toastRef.current,
        });
        toastRef.current = undefined;
      },
    },
  );

  async function handlePasswordLogin(data: { email: string; password: string }) {
    setPasswordLoading(true);
    toastRef.current = toast.loading('Logging in...');
    try {
      // Browser client writes the buyer cookie — survives new tabs.
      const supabase = createClient();
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (error) {
        throw new Error(
          error.message.toLowerCase().includes('invalid')
            ? 'Wrong email or password. Try again or use Forgot password.'
            : error.message,
        );
      }

      const userId = authData.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        if (profile?.role === 'seller') {
          await supabase.auth.signOut();
          throw new Error(
            'That email is a seller account. Use Seller portal (localhost:3001), or create a separate buyer email.',
          );
        }

        const { data: isStaff } = await supabase.rpc('is_active_staff');
        if (isStaff) {
          await supabase.auth.signOut();
          throw new Error(
            'That email is an ops staff account. Use the ops portal (localhost:3002), or create a separate buyer email.',
          );
        }
      }

      toast.success('Logged in!', { id: toastRef.current });
      toastRef.current = undefined;
      setRedirectInProgress(true);
      // Full navigation so every tab/route picks up the cookie.
      window.location.href = next ? next : '/';
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed', {
        id: toastRef.current,
      });
      toastRef.current = undefined;
      setPasswordLoading(false);
    }
  }

  return (
    <div
      data-success={emailSentSuccessMessage}
      className="container data-success:flex items-center data-success:justify-center text-left max-w-lg mx-auto overflow-auto data-success:h-full min-h-[470px]"
    >
      {emailSentSuccessMessage ? (
        <EmailConfirmationPendingCard
          type={'login'}
          heading={'Confirmation Link Sent'}
          message={emailSentSuccessMessage}
          resetSuccessMessage={setEmailSentSuccessMessage}
        />
      ) : redirectInProgress ? (
        <RedirectingPleaseWaitCard
          message="Please wait while we redirect you."
          heading="Logged in"
        />
      ) : (
        <div className="space-y-8 bg-background p-6 rounded-lg shadow-sm dark:border">
          <Tabs defaultValue="password" className="md:min-w-[400px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
              <TabsTrigger value="social-login">Social Login</TabsTrigger>
            </TabsList>
            <TabsContent value="password">
              <Card className="border-none shadow-none">
                <CardHeader className="py-6 px-0">
                  <CardTitle>
                    <ShinyText
                      text="Login to SourceByJay"
                      className="text-xl"
                      color="var(--foreground)"
                      shineColor="var(--primary)"
                    />
                  </CardTitle>
                  <CardDescription>
                    Buyer accounts only. Use a <strong>different email</strong> than your seller
                    login (Seller Central is on port 3001). Ops staff use{' '}
                    <a href="http://localhost:3002/login" className="text-primary underline">
                      port 3002
                    </a>
                    .
                  </CardDescription>
                  {authError === 'staff_account' ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                      That session was an <strong>ops staff</strong> account. Sign in at{' '}
                      <a href="http://localhost:3002/login" className="underline">
                        localhost:3002
                      </a>{' '}
                      or use a separate buyer email here.
                    </p>
                  ) : null}
                  {authError === 'seller_account' ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                      Seller accounts belong on{' '}
                      <a href="http://localhost:3001/login" className="underline">
                        localhost:3001
                      </a>
                      .
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-2 p-0">
                  <EmailAndPassword
                    isLoading={passwordLoading}
                    onSubmit={(data) => {
                      void handlePasswordLogin({
                        email: data.email,
                        password: data.password,
                      });
                    }}
                    view="sign-in"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="magic-link">
              <Card className="border-none shadow-none">
                <CardHeader className="py-6 px-0">
                  <CardTitle>
                    <ShinyText
                      text="Login to SourceByJay"
                      className="text-xl"
                      color="var(--foreground)"
                      shineColor="var(--primary)"
                    />
                  </CardTitle>
                  <CardDescription>
                    Login with magic link we will send to your email.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 p-0">
                  <Email
                    onSubmit={(email) => executeMagicLink({ email, next })}
                    isLoading={magicLinkStatus === 'executing'}
                    view="sign-in"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="social-login">
              <Card className="border-none shadow-none">
                <CardHeader className="py-6 px-0">
                  <CardTitle>
                    <ShinyText
                      text="Login to SourceByJay"
                      className="text-xl"
                      color="var(--foreground)"
                      shineColor="var(--primary)"
                    />
                  </CardTitle>
                  <CardDescription>
                    Login with your social account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 p-0">
                  <RenderProviders
                    providers={['google', 'github', 'twitter']}
                    isLoading={providerStatus === 'executing'}
                    onProviderLoginRequested={(
                      provider: 'google' | 'github' | 'twitter',
                    ) => executeProvider({ provider, next })}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
