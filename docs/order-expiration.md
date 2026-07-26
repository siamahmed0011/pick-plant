# Order expiration operations

Online Stripe and SSLCommerz orders receive a reservation deadline. The cleanup
endpoint releases expired unpaid reservations and is protected by
`CRON_SECRET`.

## Local invocation

Set `CRON_SECRET` in `.env.local`, start the application, and invoke cleanup
from a second terminal:

```powershell
npm run dev
npm run expire:orders
```

The command defaults to `http://localhost:3000`. To target another locally
running instance, pass its base URL:

```powershell
npm run expire:orders -- http://localhost:3001
```

## Non-Vercel schedulers

Configure the platform scheduler to send `GET` or `POST` every ten minutes to:

```text
https://your-store.example/api/internal/orders/expire
```

Include this HTTP header:

```text
Authorization: Bearer <CRON_SECRET>
```

For a conventional cron host, the equivalent command is:

```sh
*/10 * * * * curl --fail --silent --show-error -H "Authorization: Bearer $CRON_SECRET" https://your-store.example/api/internal/orders/expire
```

Treat any non-2xx response as retryable. Do not place `CRON_SECRET` in a URL,
source control, or client-side environment variable.
