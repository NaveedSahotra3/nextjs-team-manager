# AI Headshots & Credits Implementation Guide

Complete implementation of AI headshot generation system with Stripe-based credit management, inspired by Aragon.ai.

## Features Implemented ✅

### Database Schema

- `teamCredits` - Team credit pool management
- `memberCredits` - Individual member allocations
- `headshots` - Generation tracking & storage
- `payments` - Payment history

### Credit System

- Purchase via Stripe (packages or custom)
- Auto-distribute or manual allocation
- Real-time balance tracking
- Credit reassignment

### Stripe Integration

- Checkout sessions
- Webhook handling
- Automatic credit allocation
- Payment history

### Headshot Generation

- Upload 6-14 selfies
- Multiple styles (Professional, Casual, Creative, LinkedIn)
- Status tracking
- Download results

### Dashboards

- Admin: `/teams/[slug]/credits` - Manage credits & purchases
- Member: `/teams/[slug]/headshots` - Generate & view headshots

## Quick Setup

1. Install dependencies:

```bash
npm install stripe
```

2. Add to `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. Run migration:

```bash
npm run db:push
```

4. Set up Stripe webhook:

- URL: `https://yourdomain.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

5. For local dev, forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## API Routes

### Stripe

- `POST /api/stripe/create-checkout` - Create checkout session
- `POST /api/stripe/webhook` - Handle webhooks

### Credits

- `GET /api/teams/[teamId]/credits/overview` - Get overview
- `POST /api/teams/[teamId]/credits/allocate` - Allocate to member
- `POST /api/teams/[teamId]/credits/auto-distribute` - Auto-distribute
- `POST /api/teams/[teamId]/credits/reassign` - Reassign credits

### Headshots

- `POST /api/teams/[teamId]/headshots/generate` - Generate headshots
- `GET /api/teams/[teamId]/headshots` - List headshots
- `GET /api/teams/[teamId]/headshots/[id]` - Get specific
- `PATCH /api/teams/[teamId]/headshots/[id]` - Update status
- `DELETE /api/teams/[teamId]/headshots/[id]` - Delete

## Usage Flow

### Admin: Purchase & Distribute Credits

1. Go to `/teams/[slug]/credits`
2. Click "Purchase Credits"
3. Select package or create custom
4. Complete Stripe checkout
5. Credits auto-added to team
6. Click "Auto-distribute" or manually allocate

### Member: Generate Headshots

1. Go to `/teams/[slug]/headshots`
2. Check credit balance
3. Click "Generate Headshots"
4. Select style & upload 6-14 photos
5. Click "Generate (1 Credit)"
6. Wait for processing
7. Download results

## Credit Packages

Edit in `src/lib/stripe.ts`:

| Package      | Credits  | Price        |
| ------------ | -------- | ------------ |
| Starter      | 50       | $29          |
| Professional | 150      | $79          |
| Enterprise   | 500      | $199         |
| Custom       | Variable | $0.50/credit |

## Integration Needed

### AI Service (TODO)

Integrate with Replicate, Stability AI, or custom service in:
`src/app/api/teams/[teamId]/headshots/generate/route.ts`

Example with Replicate:

```typescript
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const output = await replicate.run("model/version", {
  input: { images: inputImages, style },
});

await db
  .update(headshots)
  .set({
    status: "completed",
    outputImages: output,
    completedAt: new Date(),
  })
  .where(eq(headshots.id, headshot.id));
```

### File Storage (TODO)

Integrate S3, Cloudinary, or Vercel Blob for image uploads.

## Testing

### Test Stripe Payment

- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

### Test Flow

1. Purchase credits
2. Allocate to member
3. Generate headshot (credits deducted)
4. Verify balance updated

## Troubleshooting

**Credits not added after payment:**

- Check webhook is configured
- Verify webhook secret in `.env`
- Use Stripe CLI for local dev

**Generation fails:**

- Check member has credits
- Verify AI service configured
- Check server logs

**Permission denied:**

- Verify team membership
- Check user role (owner/admin for credit management)

## Security

✅ Implemented:

- Authentication required
- Role-based access control
- Webhook signature verification
- SQL injection prevention

⚠️ Recommended:

- Rate limiting on generation
- File upload validation
- Credit abuse monitoring
- Audit logs

## File Structure

```
src/
├── app/api/
│   ├── stripe/
│   │   ├── create-checkout/route.ts
│   │   └── webhook/route.ts
│   └── teams/[teamId]/
│       ├── credits/
│       │   ├── allocate/route.ts
│       │   ├── auto-distribute/route.ts
│       │   ├── overview/route.ts
│       │   └── reassign/route.ts
│       └── headshots/
│           ├── generate/route.ts
│           ├── route.ts
│           └── [headshotId]/route.ts
├── app/teams/[slug]/
│   ├── credits/page.tsx
│   └── headshots/page.tsx
├── db/schema.ts
└── lib/
    ├── stripe.ts
    └── credits.ts
```

## Next Steps

1. Integrate AI service (Replicate, Stability AI, etc.)
2. Implement file storage (S3, Cloudinary, Vercel Blob)
3. Add email notifications
4. Build usage analytics
5. Add subscription plans

---

**Implementation Complete!** 🎉

For detailed documentation, see inline comments in the code files.

## Important: Client vs Server Components

### Stripe Configuration Files

The Stripe integration is split into two files to support both client and server components:

1. **`src/lib/stripe-config.ts`** - Client-safe exports
   - `CREDIT_PACKAGES` - Pricing packages
   - `getCreditPackage()` - Get package by ID
   - `calculateCustomPrice()` - Calculate custom pricing
   - `formatPrice()` - Format prices for display
   - **Use this in client components** (`"use client"`)

2. **`src/lib/stripe.ts`** - Server-only Stripe client
   - `stripe` - Initialized Stripe client with API keys
   - Re-exports all client-safe utilities from `stripe-config.ts`
   - **Use this only in API routes and server components**

### Usage Examples

**In Client Components:**

```typescript
"use client";
import { CREDIT_PACKAGES, formatPrice } from "@/lib/stripe-config";
```

**In API Routes/Server Components:**

```typescript
import { stripe, getCreditPackage } from "@/lib/stripe";
```

This separation prevents the "STRIPE_SECRET_KEY is not set" error in the browser.
