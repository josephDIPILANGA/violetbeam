# VioletBeam Deployment Checklist

## 1. Vercel project

1. Import the Git repository into Vercel.
2. Set the framework preset to Next.js.
3. Keep the build command as `npm run build`.
4. Keep the install command as `npm install`.

## 2. Environment variables

Add every variable from `.env.example` to Vercel Project Settings > Environment Variables.

For production, replace local/ngrok URLs with:

```txt
NEXT_PUBLIC_APP_URL=https://violetbeam.com
NEXTAUTH_URL=https://violetbeam.com
```

Use strong production secrets for:

```txt
NEXTAUTH_SECRET
CRON_SECRET
META_TOKEN_ENCRYPTION_KEY
STRIPE_WEBHOOK_SECRET
```

## 3. Database

Use the production Supabase/Postgres `DATABASE_URL`.

After deployment variables are set, run Prisma schema sync from a trusted machine:

```bash
npx prisma db push
npx prisma generate
```

If `db push` times out against Supabase, apply the schema from the Prisma models manually or retry from a stable connection.

## 4. Stripe

1. Use live Stripe keys when ready for real payments.
2. Configure Stripe Customer Portal.
3. Add a webhook endpoint:

```txt
https://violetbeam.com/api/billing/webhook
```

Subscribe to:

```txt
checkout.session.completed
invoice.paid
customer.subscription.updated
customer.subscription.deleted
```

Copy the webhook signing secret into:

```txt
STRIPE_WEBHOOK_SECRET
```

## 5. Meta / Instagram

Update Meta app settings with the production domain:

```txt
violetbeam.com
```

Add production callback URLs:

```txt
https://violetbeam.com/api/meta/instagram/callback
https://violetbeam.com/api/meta/instagram-login/callback
```

Also update Instagram professional connection settings if Meta requires a separate redirect URL.

## 6. Vercel Cron

`vercel.json` registers:

```txt
/api/cron/influencer-automation
```

Vercel sends `CRON_SECRET` automatically in the `Authorization` header when the environment variable exists.

After deployment, verify the cron endpoint manually:

```txt
https://violetbeam.com/api/cron/influencer-automation?secret=YOUR_CRON_SECRET&dryRun=true&limit=1
```

Expected result:

```json
{ "ok": true }
```

## 7. Smoke tests

After deployment, test:

1. `/`
2. `/cabine`
3. `/catalog`
4. `/billing`
5. `/privacy`
6. `/terms`
7. Sign up
8. Sign in
9. Stripe Checkout test/live flow
10. Try-on generation with credits
11. Instagram agent connection
12. Cron dry run
