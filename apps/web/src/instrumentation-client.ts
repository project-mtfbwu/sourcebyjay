import * as Sentry from '@sentry/nextjs';

import { buildSentryOptions } from '@sourcebyjay/observability/sentry';

const options = buildSentryOptions('web');
if (options) {
  Sentry.init(options);
}
