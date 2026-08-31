import * as Sentry from '@sentry/nextjs';

import { buildSentryOptions } from '@sourcebyjay/observability/sentry';

const options = buildSentryOptions('ops');
if (options) {
  Sentry.init(options);
}
