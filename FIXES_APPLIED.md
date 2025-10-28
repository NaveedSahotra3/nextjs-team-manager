# Bug Fixes Applied - Invitation Acceptance

## Issues Fixed

### 1. Invitation Not Being Accepted (Status Remaining "pending")

**Problem:** When a user accepted an invitation, the status remained as "pending" and they weren't added to the team.

**Root Cause:** In `/src/app/api/invitations/[token]/route.ts` on line 166, the code was checking if ANY user was a member of the team, not if the SPECIFIC user accepting the invitation was already a member. This caused the function to incorrectly return an error when the team already had the owner as a member.

**Fix Applied:**

```typescript
// BEFORE (incorrect)
const existingMembership = await db.query.teamMembers.findFirst({
  where: eq(teamMembers.teamId, invitation.teamId), // Missing userId check!
});

// AFTER (correct)
const existingMembership = await db.query.teamMembers.findFirst({
  where: and(
    eq(teamMembers.teamId, invitation.teamId),
    eq(teamMembers.userId, user.id) // Now checks the specific user
  ),
});
```

### 2. Teams Not Showing for Invited Members

**Problem:** After accepting an invitation, the team didn't appear in the invited member's team list.

**Root Cause:** In `/src/app/api/teams/route.ts`, the query used a `leftJoin` with a complex `where` clause that didn't properly fetch teams where the user was only a member (not owner).

**Fix Applied:**

```typescript
// BEFORE (complex and potentially incorrect)
const userTeams = await db
  .select({...})
  .from(teams)
  .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
  .where(
    or(
      eq(teams.ownerId, session.user.id),
      and(eq(teamMembers.userId, session.user.id))
    )
  );

// AFTER (simple and correct)
const userTeams = await db
  .select({...})
  .from(teamMembers)  // Start from teamMembers
  .innerJoin(teams, eq(teamMembers.teamId, teams.id))
  .where(eq(teamMembers.userId, session.user.id));
```

## How to Test

1. **Clear any pending invitations in your database** (optional, to start fresh):

   ```sql
   UPDATE invitations SET status = 'expired' WHERE status = 'pending';
   ```

2. **Test the invitation flow again:**
   - Sign in as the team owner
   - Go to `/teams/[your-team-slug]`
   - Click "Invite" button
   - Enter the invited member's email
   - Select a role (admin or member)
   - Click "Send Invitation"

3. **Accept the invitation:**
   - Sign in as the invited member (or use the invitation email)
   - Click the invitation link from the email
   - You should see the invitation details
   - Click "Accept Invitation"
   - **You should see "Success! You've successfully joined [Team Name]"**
   - You'll be redirected to the team page

4. **Verify the fix:**
   - Go to `/teams` as the invited member
   - **The team should now appear in your teams list**
   - Check the database:
     - `invitations` table: status should be "accepted"
     - `team_members` table: invited user should have a row with correct teamId and role
   - Go back to the team page as owner
   - **The invited member should appear in the team members list**

## Database Verification Queries

Check invitation status:

```sql
SELECT id, email, status, accepted_at
FROM invitations
WHERE email = 'invited-member@example.com'
ORDER BY created_at DESC;
```

Check team membership:

```sql
SELECT tm.*, u.email, u.name
FROM team_members tm
JOIN users u ON tm.user_id = u.id
WHERE tm.team_id = 'your-team-id';
```

## Files Modified

1. `/src/app/api/invitations/[token]/route.ts`
   - Added `and` import from drizzle-orm
   - Fixed membership check to include userId

2. `/src/app/api/teams/route.ts`
   - Simplified team listing query
   - Changed from leftJoin to innerJoin
   - Removed unused `or` and `and` imports

## What This Fixes

✅ Invitations now properly accept and update status to "accepted"
✅ Users are correctly added to `team_members` table with their assigned role
✅ Invited members can now see teams they've been invited to in their teams list
✅ Team owners can see invited members in the team member list
✅ Prevents false "already a member" errors

## Next Steps

After testing, you should have a fully functional invitation system where:

- Team owners/admins can invite members
- Invited members receive emails with secure links
- Members can accept invitations and join teams
- Teams appear correctly for all members
- Role-based permissions work as expected
