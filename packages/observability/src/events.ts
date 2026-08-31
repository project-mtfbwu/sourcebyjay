/** PostHog event names — keep stable for funnel dashboards. */
export const AnalyticsEvents = {
  searchSubmitted: 'search_submitted',
  searchResultClicked: 'search_result_clicked',
  productViewed: 'product_viewed',
  rfqSubmitted: 'rfq_submitted',
  orderPlaced: 'order_placed',
  signupCompleted: 'signup_completed',
  sellerLogin: 'seller_login',
  opsLogin: 'ops_login',
  trendRefreshJob: 'trend_refresh_job',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export type PortalId = 'web' | 'vendor' | 'ops';
