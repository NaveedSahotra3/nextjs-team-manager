# Team Management System - Implementation Guide

## Overview

This guide documents the complete team management and invitation system implemented in your Next.js application.

## Features

### 1. Team Management

- Create teams with unique slugs
- View all teams (owned + member of)
- View team details with member list
- Delete teams (owner only)

### 2. Invitation System

- Send email invitations to team members
- Secure token-based invitation links (32 characters)
- 7-day expiration for invitations
- Accept invitations via unique link
- Track invitation status (pending/accepted/expired)
- Email verification when accepting invitations

### 3. Member Management

- View team members with roles (owner/admin/member)
- Role-based access control
- Owner and Admin can invite members
- Automatic owner role assignment on team creation

## Project Structure

### Pages

```
/teams                    - List all teams
/teams/create             - Create new team
/teams/[slug]             - View team details, members, and send invitations
/invitations/[token]      - Accept team invitation
```

### API Routes

```
GET  /api/teams                          - Get all user teams
POST /api/teams                          - Create new team
GET  /api/teams/[slug]                   - Get team details with members
DELETE /api/teams/[slug]                 - Delete team (owner only)
GET  /api/teams/[slug]/invitations       - Get team invitations
POST /api/teams/[slug]/invitations       - Send invitation
GET  /api/invitations/[token]            - Get invitation details
POST /api/invitations/[token]            - Accept invitation
```

## Database Schema

### Teams Table

- `id` - UUID (primary key)
- `name` - varchar(255)
- `slug` - varchar(255) unique
- `description` - text (nullable)
- `ownerId` - UUID (foreign key to users)
- `createdAt` - timestamp
- `updatedAt` - timestamp

### Team Members Table

- `id` - UUID (primary key)
- `teamId` - UUID (foreign key to teams)
- `userId` - UUID (foreign key to users)
- `role` - enum (owner, admin, member)
- `joinedAt` - timestamp

### Invitations Table

- `id` - UUID (primary key)
- `teamId` - UUID (foreign key to teams)
- `email` - varchar(255)
- `role` - enum (admin, member)
- `invitedBy` - UUID (foreign key to users)
- `token` - varchar(255) unique
- `status` - enum (pending, accepted, expired)
- `expiresAt` - timestamp
- `createdAt` - timestamp
- `acceptedAt` - timestamp (nullable)

## Usage Flow

### Creating a Team

1. User navigates to `/teams/create`
2. Fills in team name, slug (auto-generated), and optional description
3. On submit, creates team and adds user as owner
4. Redirects to team detail page

### Inviting Members

1. Team owner/admin navigates to `/teams/[slug]`
2. Clicks "Invite" button
3. Enters email and selects role (admin/member)
4. System:
   - Validates user permissions
   - Checks if user is already a member
   - Checks for existing pending invitations
   - Creates invitation with unique token
   - Sends email with invitation link
5. Email contains link to `/invitations/[token]`

### Accepting Invitations

1. User receives email with invitation link
2. Clicks link to `/invitations/[token]`
3. System shows invitation details
4. If not signed in:
   - Shows option to sign in or create account
   - Redirects back after authentication
5. If signed in with correct email:
   - Shows "Accept Invitation" button
   - On accept, adds user to team
   - Marks invitation as accepted
   - Redirects to team page
6. If signed in with different email:
   - Shows error and prompt to sign in with correct account

## Email Configuration

The system uses nodemailer for sending invitation emails. Ensure your `.env` file has:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
NEXTAUTH_URL=http://localhost:3000
```

## Security Features

1. **Authentication Required**: All team operations require authentication
2. **Role-Based Access**:
   - Only owners can delete teams
   - Owners and admins can invite members
   - Members can view team details
3. **Email Verification**: Invitations can only be accepted by the invited email
4. **Token Expiration**: Invitations expire after 7 days
5. **Unique Tokens**: 32-character nanoid tokens for invitations
6. **SQL Injection Protection**: Using Drizzle ORM with parameterized queries

## Future Enhancements

### Suggested Features:

1. **Member Management**
   - Remove members from team
   - Change member roles
   - Transfer ownership

2. **Invitation Management**
   - Revoke pending invitations
   - Resend invitations
   - Custom invitation messages

3. **Team Settings**
   - Update team details
   - Team avatar/logo
   - Team visibility settings (public/private)

4. **Notifications**
   - In-app notifications for invitations
   - Email notifications for team activities
   - Notification preferences

5. **Activity Logs**
   - Track team member activities
   - Audit log for security
   - Export activity reports

6. **Advanced Permissions**
   - Custom roles beyond owner/admin/member
   - Granular permissions per feature
   - Permission templates

7. **Team Discovery**
   - Browse public teams
   - Search teams
   - Join requests for public teams

8. **Bulk Operations**
   - Bulk invite members via CSV
   - Bulk role changes
   - Batch notifications

## API Examples

### Create Team

```typescript
POST /api/teams
Content-Type: application/json

{
  "name": "My Awesome Team",
  "slug": "my-awesome-team",
  "description": "A team for awesome people"
}
```

### Send Invitation

```typescript
POST /api/teams/my-awesome-team/invitations
Content-Type: application/json

{
  "email": "colleague@example.com",
  "role": "member"
}
```

### Accept Invitation

```typescript
POST / api / invitations / abc123token456;
```

## Testing Checklist

- [ ] Create a team
- [ ] View teams list
- [ ] View team details
- [ ] Invite a member (admin role)
- [ ] Invite a member (member role)
- [ ] Accept invitation with correct email
- [ ] Try accepting invitation with wrong email
- [ ] Check expired invitation handling
- [ ] Test role-based access (non-admin trying to invite)
- [ ] Delete team (as owner)
- [ ] Try deleting team (as non-owner)

## Troubleshooting

### Email Not Sending

- Check SMTP configuration in `.env`
- Verify SMTP credentials
- Check firewall/port access
- Test with nodemailer connection verification

### Invitation Link Not Working

- Ensure `NEXTAUTH_URL` is set correctly
- Check token generation (should be 32 characters)
- Verify invitation hasn't expired
- Check database for invitation record

### Permission Issues

- Verify user session is active
- Check team membership in database
- Ensure role is correctly assigned

## Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Database operations
npm run db:generate   # Generate migrations
npm run db:push       # Push schema changes
npm run db:studio     # Open Drizzle Studio
```

## Contributing

When extending this system:

1. Follow existing patterns for API routes
2. Use validation schemas from `@/lib/validations`
3. Implement proper error handling
4. Add appropriate TypeScript types
5. Test all role-based access scenarios
6. Document new features in this guide
