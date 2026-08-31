import { Suspense } from 'react';
import { z } from 'zod';
import { Login } from './Login';

const SearchParamsSchema = z.object({
  next: z.string().optional(),
  error: z.enum(['staff_account', 'seller_account']).optional(),
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function LoginWrapper(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const { next, error } = SearchParamsSchema.parse(searchParams);
  return <Login next={next} authError={error} />;
}

export default async function LoginPage(props: {
  searchParams: SearchParams;
}) {
  return <Suspense>
    <LoginWrapper searchParams={props.searchParams} />
  </Suspense>
}
