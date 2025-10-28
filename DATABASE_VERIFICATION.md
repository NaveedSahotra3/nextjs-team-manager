# Database & Package Verification Guide

## Package Changes Summary

### Packages Modified:

- **@neondatabase/serverless**: `^1.0.2` (downgraded)
- **nodemailer**: `^6.10.1` (downgraded)
- **vercel.json**: Added with `--legacy-peer-deps` for compatibility

## Verification Steps

### 1. Database Connection Test

Test your Neon database connection:

```bash
# Start the development server
npm run dev
```

Then visit in your browser or use curl:

```bash
curl http://localhost:3000/api/test-db
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Database connection successful!",
  "tests": {
    "usersTable": "✓ Accessible",
    "teamsTable": "✓ Accessible",
    "teamMembersTable": "✓ Accessible",
    "invitationsTable": "✓ Accessible",
    "neonConnection": "✓ Working"
  },
  "details": {
    "usersFound": true,
    "teamsFound": true,
    "membersFound": true,
    "invitationsFound": true,
    "connectionQueryResult": { "test": 1 }
  },
  "packages": {
    "neonVersion": "@neondatabase/serverless@^1.0.2",
    "nodemailerVersion": "nodemailer@^6.10.1"
  }
}
```

### 2. Email Functionality Test

Test nodemailer email sending (requires authentication):

**Steps:**

1. Sign in to your application
2. Make a POST request to test email endpoint:

```bash
# Replace with your auth token/cookie
curl -X POST http://localhost:3000/api/test-email \
  -H "Cookie: your-session-cookie"
```

Or use your browser console:

```javascript
fetch("/api/test-email", { method: "POST" })
  .then((r) => r.json())
  .then(console.log);
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Test email sent successfully to your@email.com",
  "nodemailerVersion": "nodemailer@^6.10.1"
}
```

**Check your email inbox** for the test email.

### 3. Manual Testing Checklist

- [ ] **Authentication**
  - [ ] Sign in works
  - [ ] Sign out works
  - [ ] Sign up works
  - [ ] Session persists

- [ ] **Teams**
  - [ ] Can view teams list
  - [ ] Can create new team
  - [ ] Can view team details
  - [ ] Can update team settings
  - [ ] Can delete team (owner only)

- [ ] **Team Members**
  - [ ] Can view team members
  - [ ] Can change member roles
  - [ ] Can remove members
  - [ ] Members can leave team

- [ ] **Invitations**
  - [ ] Can send invitations (email sent)
  - [ ] Email contains valid invitation link
  - [ ] Can accept invitation via link
  - [ ] Invitation status updates to "accepted"
  - [ ] User added to team_members table
  - [ ] Can revoke pending invitations

### 4. Database Queries Working

All these should work without errors:

```typescript
// Users query
db.select().from(users);

// Teams query
db.select().from(teams);

// TeamMembers query with relations
db.query.teamMembers.findFirst({
  where: eq(teamMembers.userId, userId),
  with: { user: true, team: true },
});

// Invitations query
db.query.invitations.findFirst({
  where: eq(invitations.token, token),
});
```

## Build Verification

```bash
# Check TypeScript types
npm run type-check

# Check ESLint
npm run lint

# Test build (may have unrelated issues with error pages)
npm run build
```

## Known Issues

If you encounter any issues:

1. **Database Connection Errors**
   - Verify `DATABASE_URL` in `.env`
   - Check Neon dashboard for connection status
   - Ensure `@neondatabase/serverless@^1.0.2` is installed

2. **Email Sending Errors**
   - Verify email credentials in `.env`
   - Check SMTP settings
   - Ensure `nodemailer@^6.10.1` is installed

3. **Build Errors**
   - Some build errors related to HTML imports in error pages are pre-existing
   - These don't affect runtime functionality

## Vercel Deployment

The `vercel.json` configuration ensures compatibility:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs"
}
```

## Success Indicators

✅ You're good to go if:

- Database test endpoint returns success
- Email test sends successfully
- Sign in/out works
- Team invitation flow completes successfully
- No runtime errors in console
- All team management features work

## Cleanup

After verification, you can optionally remove the test endpoints:

- `/src/app/api/test-db/route.ts`
- `/src/app/api/test-email/route.ts`

These are safe to delete once you've confirmed everything works.
