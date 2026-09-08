// Decimal bytes. Reservations and retained versions consume the same allowance.
export const CLOUD_POLICY = Object.freeze({
  quotaBytes: 1_000_000_000,
  maxLibraries: 50,
  globalQuotaBytes: 50_000_000_000,
  quotaLabel: '1 GB',
})
