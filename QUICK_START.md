# Quick Start Guide: Testing the Headshots & Credits System

## Prerequisites

- Stripe account (free test mode)
- Database running
- Node.js installed

## 5-Minute Setup

### Step 1: Install Dependencies (30 seconds)

```bash
npm install stripe
```

### Step 2: Configure Stripe (2 minutes)

1. Go to [stripe.com](https://stripe.com) and create account
2. Visit Dashboard → Developers → API keys
3. Copy **Publishable key** and **Secret key**
4. Add to `.env`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

### Step 3: Set Up Webhook for Local Testing (1 minute)

```bash
# Install Stripe CLI (if not installed)
# macOS: brew install stripe/stripe-cli/stripe
# Windows: scoop install stripe
# Linux: See https://stripe.com/docs/stripe-cli

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret (starts with whsec_)
# Add to .env:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 4: Run Migration (30 seconds)

```bash
npm run db:push
```

### Step 5: Start Server (30 seconds)

```bash
npm run dev
```

## Test the Flow (5 minutes)

### 1. Create a Team (if you don't have one)

```
Navigate to: http://localhost:3000/teams/create
→ Fill in team name, slug
→ Submit
```

### 2. Initialize Credits for Team

Add this code to your team creation or run it manually:

```typescript
import { initializeTeamCredits } from "@/lib/credits";

await initializeTeamCredits(
  "your-team-id", // Get from database
  5, // Estimated members
  20 // Estimated headshots per member
);
```

Or use the database directly:

```sql
INSERT INTO team_credits (team_id, total_credits, used_credits, estimated_headshots_per_member, estimated_members)
VALUES ('your-team-id', '0', '0', '20', '5');
```

### 3. Test Credit Purchase

```
Navigate to: http://localhost:3000/teams/your-slug/credits
→ Click "Purchase Credits"
→ Select "Professional Package" (150 credits, $79)
→ Click "Continue to Checkout"
→ Enter test card: 4242 4242 4242 4242
→ Expiry: 12/34
→ CVC: 123
→ Complete payment
→ You'll be redirected back
→ Check that credits appear in dashboard
```

**Verify:**

- ✅ Redirected with success message
- ✅ Total credits shows 150
- ✅ Available credits shows 150

### 4. Test Credit Allocation

```
On credits page:
→ Click "Auto-distribute" button
→ Confirm the action
→ Check "Member Credits" section
→ Each member should have credits allocated
```

**Or allocate manually:**

```
→ Click "Allocate Credits"
→ Select a member
→ Enter amount (e.g., 20)
→ Submit
→ Member's allocated credits should update
```

### 5. Test Headshot Generation

```
Navigate to: http://localhost:3000/teams/your-slug/headshots
→ Click "Generate Headshots"
→ Select style (e.g., "Professional")
→ Upload 6-14 test images (any images work for testing)
→ Click "Generate (1 Credit)"
```

**Verify:**

- ✅ Success message appears
- ✅ Credit balance decreased by 1
- ✅ New headshot appears in list with "processing" status
- ✅ Check database: headshots table has new record

### 6. Check Everything Works

**In Stripe Dashboard:**

- Go to Payments → should see $79 test payment
- Go to Webhooks → should see events fired

**In Database:**

```sql
-- Check team credits
SELECT * FROM team_credits WHERE team_id = 'your-team-id';
-- Should show: total_credits = 150, used_credits = 1

-- Check member credits
SELECT * FROM member_credits WHERE team_id = 'your-team-id';
-- Should show allocated and used credits

-- Check headshots
SELECT * FROM headshots WHERE team_id = 'your-team-id';
-- Should show the generated headshot record

-- Check payments
SELECT * FROM payments WHERE team_id = 'your-team-id';
-- Should show the payment record with status 'succeeded'
```

## Common Test Scenarios

### Test Insufficient Credits

1. Allocate only 1 credit to member
2. Generate 1 headshot (uses the credit)
3. Try to generate another
4. Should see error: "Insufficient credits"

### Test Multiple Packages

Try purchasing different packages:

- Starter (50 credits, $29)
- Enterprise (500 credits, $199)
- Custom (e.g., 100 credits, $50)

### Test Credit Reassignment

```
Credits page → Click "Allocate Credits"
→ Give Member A: 20 credits
→ Give Member B: 30 credits
→ Verify both have correct amounts
```

## Troubleshooting Test Issues

### Webhook not receiving events

```bash
# Make sure Stripe CLI is running:
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Keep this terminal open while testing
```

### Credits not appearing after payment

1. Check Stripe CLI terminal for webhook events
2. Check your server logs for errors
3. Verify `STRIPE_WEBHOOK_SECRET` in `.env` matches CLI output
4. Try payment again

### Can't see credits page

- Verify you're logged in
- Check you're a member/owner of the team
- URL should be: `/teams/[slug]/credits`

### Generation fails

- Check server logs for specific error
- Verify member has allocated credits
- Ensure at least 6 images uploaded

## Next: Integrate Real AI

Once testing is complete, integrate an AI service:

**Option 1: Replicate**

```bash
npm install replicate
```

**Option 2: Stability AI**

```bash
# No package needed, just API key
```

See [HEADSHOTS_IMPLEMENTATION.md](./HEADSHOTS_IMPLEMENTATION.md) for integration guides.

## Test Cards Reference

| Card Number         | Scenario                 |
| ------------------- | ------------------------ |
| 4242 4242 4242 4242 | Success                  |
| 4000 0000 0000 0002 | Declined                 |
| 4000 0027 6000 3184 | 3D Secure authentication |
| 4000 0000 0000 9995 | Insufficient funds       |

**Always use:**

- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

---

**You're all set!** 🎉

The system is fully functional for testing. Just add AI integration when ready!
