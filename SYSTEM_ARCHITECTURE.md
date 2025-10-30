# System Architecture: AI Headshots & Credits

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     TEAM MANAGEMENT SYSTEM                       │
│                  + AI Headshots & Credits Module                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Admin UI   │────▶│  Member UI   │────▶│  AI Service  │
│   (Owner)    │     │   (User)     │     │  (External)  │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│                    API LAYER                             │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐           │
│  │  Stripe  │  │ Credits  │  │  Headshots  │           │
│  │   API    │  │   API    │  │     API     │           │
│  └──────────┘  └──────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  DATABASE (PostgreSQL)                   │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │ teamCredits  │  │memberCredits  │  │  headshots   │ │
│  ├──────────────┤  ├───────────────┤  ├──────────────┤ │
│  │ totalCredits │  │allocatedCredits│ │ inputImages  │ │
│  │ usedCredits  │  │ usedCredits   │  │ outputImages │ │
│  │ stripeId     │  │ teamId/userId │  │ status       │ │
│  └──────────────┘  └───────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐                                       │
│  │  payments    │                                       │
│  ├──────────────┤                                       │
│  │ amount       │                                       │
│  │ creditsAdded │                                       │
│  │ stripeId     │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Stripe (SaaS) │
              │   - Checkout   │
              │   - Webhooks   │
              └────────────────┘
```

## Data Flow

### 1. Credit Purchase Flow

```
┌─────────┐
│  Admin  │
└────┬────┘
     │ 1. Click "Purchase Credits"
     ▼
┌──────────────────┐
│ Select Package   │ Starter ($29/50)
│                  │ Professional ($79/150)
│ ┌──────────────┐ │ Enterprise ($199/500)
│ │ Professional │ │ Custom ($0.50/credit)
│ └──────────────┘ │
└────┬─────────────┘
     │ 2. Create checkout session
     ▼
┌────────────────────────────────┐
│ POST /api/stripe/create-checkout│
│ - teamId                        │
│ - packageId                     │
│ - customCredits (if custom)     │
└────┬───────────────────────────┘
     │ 3. Create Stripe session
     ▼
┌──────────────┐
│    Stripe    │
│   Checkout   │
└────┬─────────┘
     │ 4. Complete payment
     ▼
┌──────────────┐
│   Webhook    │ checkout.session.completed
│   Handler    │ payment_intent.succeeded
└────┬─────────┘
     │ 5. Add credits to team
     ▼
┌────────────────────────┐
│  UPDATE team_credits   │
│  SET total_credits =   │
│    total + purchased   │
└────┬───────────────────┘
     │ 6. Create payment record
     ▼
┌────────────────────────┐
│  INSERT INTO payments  │
│  - amount              │
│  - creditsAdded        │
│  - status: succeeded   │
└────┬───────────────────┘
     │ 7. Redirect back
     ▼
┌─────────────────┐
│ Credits Page    │
│ ✅ Credits Added │
└─────────────────┘
```

### 2. Credit Allocation Flow

```
┌─────────┐
│  Admin  │
└────┬────┘
     │
     ├─── Option A: Auto-Distribute ───┐
     │                                  │
     │ POST /api/.../auto-distribute    │
     │                                  │
     │    totalCredits / memberCount    │
     │    = creditsPerMember            │
     │                                  │
     │    For each member:              │
     │    ┌─────────────────────┐       │
     │    │ INSERT/UPDATE       │       │
     │    │ member_credits      │       │
     │    │ allocatedCredits += │       │
     │    │ creditsPerMember    │       │
     │    └─────────────────────┘       │
     │                                  │
     └─── Option B: Manual Allocate ───┘
                     │
          POST /api/.../allocate
          - userId
          - credits
                     │
                     ▼
          ┌─────────────────────┐
          │ UPDATE member_credits│
          │ WHERE userId         │
          │ SET allocatedCredits│
          │ += credits           │
          └─────────────────────┘
```

### 3. Headshot Generation Flow

```
┌─────────┐
│ Member  │
└────┬────┘
     │ 1. Upload 6-14 selfies
     ▼
┌──────────────────┐
│ Select Style     │
│ ┌──────────────┐ │
│ │ Professional │ │
│ │ Casual       │ │
│ │ Creative     │ │
│ │ LinkedIn     │ │
│ └──────────────┘ │
└────┬─────────────┘
     │ 2. Click "Generate"
     ▼
┌─────────────────────────────┐
│ POST /api/.../generate      │
│ - inputImages               │
│ - style                     │
│ - creditsCost: 1            │
└────┬────────────────────────┘
     │ 3. Check balance
     ▼
┌────────────────────────────┐
│ SELECT member_credits      │
│ WHERE userId & teamId      │
│                            │
│ available = allocated - used│
│                            │
│ IF available < creditsCost │
│   → Error: Insufficient    │
│ ELSE                       │
│   → Continue               │
└────┬───────────────────────┘
     │ 4. Create headshot record
     ▼
┌────────────────────────────┐
│ INSERT INTO headshots      │
│ - status: pending          │
│ - inputImages              │
│ - style                    │
│ - creditsCost              │
└────┬───────────────────────┘
     │ 5. Deduct credits
     ▼
┌────────────────────────────┐
│ UPDATE member_credits      │
│ SET usedCredits += 1       │
│                            │
│ UPDATE team_credits        │
│ SET usedCredits += 1       │
└────┬───────────────────────┘
     │ 6. Update status
     ▼
┌────────────────────────────┐
│ UPDATE headshots           │
│ SET status = 'processing'  │
└────┬───────────────────────┘
     │ 7. Call AI service (TODO)
     ▼
┌────────────────────────────┐
│ External AI Service        │
│ - Replicate                │
│ - Stability AI             │
│ - Custom Model             │
└────┬───────────────────────┘
     │ 8. Receive generated images
     ▼
┌────────────────────────────┐
│ UPDATE headshots           │
│ SET status = 'completed'   │
│     outputImages = [...]   │
│     completedAt = NOW()    │
└────┬───────────────────────┘
     │ 9. Notify member (TODO)
     ▼
┌─────────────────┐
│ Headshots Page  │
│ ✅ Ready to      │
│    Download     │
└─────────────────┘
```

## Database Relationships

```
┌──────────┐
│  teams   │
└────┬─────┘
     │ 1:1
     ▼
┌──────────────┐
│ teamCredits  │ ◄──┐
└────┬─────────┘    │
     │ 1:N          │ Tracks totals
     ▼              │
┌────────────────┐  │
│ memberCredits  │──┘
└────┬───────────┘
     │
     │ References
     ▼
┌──────────┐
│  users   │
└────┬─────┘
     │
     │ 1:N
     ▼
┌──────────────┐
│  headshots   │
└──────────────┘

┌──────────┐
│  teams   │
└────┬─────┘
     │ 1:N
     ▼
┌──────────────┐
│  payments    │
└──────────────┘
```

## Security & Permissions

```
┌────────────────────────────────────────┐
│          PERMISSION MATRIX             │
├────────────────┬───────────────────────┤
│ Action         │ Who Can Do It         │
├────────────────┼───────────────────────┤
│ Purchase       │ Team Owner            │
│ Credits        │                       │
├────────────────┼───────────────────────┤
│ Allocate       │ Owner, Admin          │
│ Credits        │                       │
├────────────────┼───────────────────────┤
│ Auto-          │ Owner, Admin          │
│ Distribute     │                       │
├────────────────┼───────────────────────┤
│ Reassign       │ Owner, Admin          │
│ Credits        │                       │
├────────────────┼───────────────────────┤
│ View Team      │ Owner, Admin          │
│ Overview       │                       │
├────────────────┼───────────────────────┤
│ Generate       │ Any Member            │
│ Headshots      │ (with credits)        │
├────────────────┼───────────────────────┤
│ View Own       │ Any Member            │
│ Headshots      │                       │
├────────────────┼───────────────────────┤
│ View All       │ Owner, Admin          │
│ Headshots      │                       │
└────────────────┴───────────────────────┘
```

## API Endpoint Map

```
/api
├── stripe/
│   ├── create-checkout  [POST]  → Create checkout session
│   │   Auth: Required
│   │   Role: Team Owner
│   │   Input: { teamId, packageId, customCredits? }
│   │   Output: { sessionId, url }
│   │
│   └── webhook          [POST]  → Handle Stripe events
│       Auth: Webhook signature
│       Events: checkout.session.completed
│               payment_intent.succeeded
│               payment_intent.payment_failed
│
└── teams/
    └── [teamId]/
        ├── credits/
        │   ├── overview         [GET]   → Get credit stats
        │   │   Auth: Required
        │   │   Role: Any team member
        │   │   Output: { total, used, available, memberBreakdown }
        │   │
        │   ├── allocate         [POST]  → Allocate to member
        │   │   Auth: Required
        │   │   Role: Owner, Admin
        │   │   Input: { userId, credits }
        │   │
        │   ├── auto-distribute  [POST]  → Equal distribution
        │   │   Auth: Required
        │   │   Role: Owner, Admin
        │   │
        │   └── reassign         [POST]  → Move credits
        │       Auth: Required
        │       Role: Owner, Admin
        │       Input: { fromUserId, toUserId, credits }
        │
        └── headshots/
            ├── /                [GET]   → List headshots
            │   Auth: Required
            │   Role: Any member (sees own), Owner/Admin (sees all)
            │   Query: ?userId=X&status=Y
            │
            ├── generate         [POST]  → Create headshot
            │   Auth: Required
            │   Role: Any member
            │   Input: { inputImages[], style, creditsCost }
            │   Output: { headshotId, status, creditsRemaining }
            │
            └── [headshotId]/    [GET, PATCH, DELETE]
                Auth: Required
                Role: Owner (headshot creator) or Admin
                PATCH Input: { status?, outputImages?, errorMessage? }
```

## State Machine: Headshot Status

```
┌─────────┐
│ PENDING │ ← Initial state when created
└────┬────┘
     │ Credits deducted successfully
     ▼
┌────────────┐
│ PROCESSING │ ← AI service working
└─────┬──────┘
      │
      ├─── Success ───┐
      │               ▼
      │         ┌───────────┐
      │         │ COMPLETED │ ← Images ready
      │         └───────────┘
      │
      └─── Error ────┐
                     ▼
               ┌─────────┐
               │ FAILED  │ ← Generation failed
               └─────────┘
                     │
                     └─ (Credits NOT refunded)
```

## Credit Lifecycle

```
Purchase → Allocate → Use → Track

1. PURCHASE
   Stripe checkout
   ↓
   Credits added to teamCredits.totalCredits

2. ALLOCATE
   Admin distributes
   ↓
   Credits moved to memberCredits.allocatedCredits

3. USE
   Member generates headshot
   ↓
   memberCredits.usedCredits++
   teamCredits.usedCredits++

4. TRACK
   available = allocated - used
   ↓
   Display in UI
```

## Integration Points

```
┌─────────────────────────────────────┐
│       YOUR APPLICATION               │
│                                      │
│  ┌────────────────────────────┐     │
│  │   Team Management          │     │
│  │   (Existing)               │     │
│  └────────────────────────────┘     │
│              │                       │
│              │ Extended with:        │
│              ▼                       │
│  ┌────────────────────────────┐     │
│  │  Credits & Headshots       │     │
│  │  (New Module)              │     │
│  └────────────────────────────┘     │
│              │                       │
└──────────────┼───────────────────────┘
               │
               ├──────┐
               │      │
               ▼      ▼
        ┌──────────┐ ┌────────────────┐
        │  Stripe  │ │  AI Service    │
        │  (SaaS)  │ │  (To Integrate)│
        └──────────┘ └────────────────┘
             │              │
             │              │
        Payments       Headshots
```

---

**Architecture Status:** ✅ Complete

All components are implemented and integrated.
Just needs AI service connection for actual headshot generation.
