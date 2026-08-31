import { getLoggedInUserId } from '@/data/user/user';
import { createSafeActionClient } from 'next-safe-action';
import 'server-only';

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Something went wrong while executing the operation.';
  },
}).use(async ({ next }) => next());

export const authActionClient = actionClient.use(async ({ next }) => {
  const userId = await getLoggedInUserId();
  return await next({
    ctx: {
      userId,
    },
  });
});
