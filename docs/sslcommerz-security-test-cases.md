# SSLCommerz security test cases

The project does not currently include a test runner. When one is added, cover
the exported pure helpers in `src/lib/payments/providers/sslcommerz.ts` and the
shared reconciliation flow in
`src/lib/payments/sslcommerz-reconciliation.ts`.

| Case | Expected result |
| --- | --- |
| Valid BDT payment | Validation response and both local amounts/providers match; transaction becomes `VERIFIED`, order becomes `PAID`, and one history/event record is created. |
| Forged status and fake `val_id` | Submitted status is ignored as proof; failed validation returns `400` and makes no database changes. |
| Validation API failure or timeout | Returns retryable `502`/`503` and makes no database changes. |
| Wrong amount | Exact Decimal reconciliation fails with `400`. |
| Wrong currency | Any non-BDT provider, order, or transaction currency fails with `400`. |
| Wrong `tran_id` | No matching local merchant transaction is accepted. |
| Wrong provider | Order or transaction provider mismatch fails with `400`. |
| `risk_level=1` | Order is not paid; transaction remains `PENDING` with the safe manual-review reason visible in admin order details. |
| Duplicate callback/IPN | The unique processed-event claim returns idempotent `200`; no duplicate history is created. |
| Concurrent callback and IPN | One transaction wins the unique event claim; the losing request returns idempotent `200`. |
| Already paid order | Valid proof may be recorded, but no duplicate paid update or history is created. |
| Late failed/cancelled notification | Returns an ignored/failure UX response and does not mutate verified payment state. |
| Database failure | The transaction rolls back the event claim and returns `500`, allowing a later retry. |
| Sandbox configuration | Exact value `true` selects only the sandbox initiation and validation endpoints. |
| Production configuration | Exact value `false` selects only the production initiation and validation endpoints. |
| Missing/invalid environment flag | Configuration fails closed with `503`. |
