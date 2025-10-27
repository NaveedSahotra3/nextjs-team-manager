# Implementation Guide - What to Build Next

This guide shows the exact files you need to create to complete Module 1.

## 🎯 Current Status

✅ **Completed**:
- Project setup and configuration
- TypeScript, ESLint, Prettier, Husky
- Database schema with Drizzle ORM
- NextAuth configuration
- Email system with NodeMailer
- Security utilities
- Validation schemas
- Base UI components
- Documentation

⚠️ **To Implement**:
- Authentication pages (Sign Up, Sign In)
- API routes (Auth, Teams, Invitations)
- Team management UI
- Dashboard
- Protected routes middleware

## 📝 Implementation Checklist

### Phase 1: Authentication UI (Priority: HIGH)

#### 1.1 Sign Up Page
**File**: `src/app/auth/signup/page.tsx`

```typescript
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 1.2 Sign Up Form Component
**File**: `src/components/auth/SignUpForm.tsx`

Key features to implement:
- React Hook Form with Zod validation
- Password strength indicator
- Form submission to `/api/auth/signup`
- Success/error handling
- Redirect to sign in after success

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpInput } from "@/lib/validations";
// ... implement form
```

#### 1.3 Sign In Page
**File**: `src/app/auth/signin/page.tsx`

Similar structure to Sign Up page but simpler form.

#### 1.4 Sign In Form Component
**File**: `src/components/auth/SignInForm.tsx`

Key features:
- Email/password fields
- Sign in with NextAuth
- Remember me option
- Forgot password link (future)
- Link to sign up page

### Phase 2: Authentication API (Priority: HIGH)

#### 2.1 Sign Up API Route
**File**: `src/app/api/auth/signup/route.ts`

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/security";
import { signUpSchema } from "@/lib/validations";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validatedData = signUpSchema.parse(body);
    
    // Check if user exists
    // Hash password
    // Create user in database
    // Return success response
  } catch (error) {
    // Handle errors appropriately
  }
}
```

#### 2.2 NextAuth API Route
**File**: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### Phase 3: Middleware for Protected Routes (Priority: HIGH)

#### 3.1 Auth Middleware
**File**: `src/middleware.ts`

```typescript
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => token !== null,
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/teams/:path*"],
};
```

### Phase 4: Dashboard & Team Management (Priority: MEDIUM)

#### 4.1 Dashboard Page
**File**: `src/app/dashboard/page.tsx`

Features:
- Welcome message with user name
- List of user's teams
- Create new team button
- Recent invitations
- Quick actions

#### 4.2 Teams List Page
**File**: `src/app/teams/page.tsx`

Features:
- Grid/list of teams
- Create team dialog
- Team search/filter
- Team stats

#### 4.3 Create Team API
**File**: `src/app/api/teams/route.ts`

```typescript
export async function GET(request: Request): Promise<NextResponse> {
  // Get user's teams
}

export async function POST(request: Request): Promise<NextResponse> {
  // Create new team
  // Make creator the owner
  // Add to team_members
}
```

#### 4.4 Team Detail Page
**File**: `src/app/teams/[id]/page.tsx`

Features:
- Team information
- Members list
- Invite button
- Team settings (for owner/admin)
- Leave team button

#### 4.5 Team API Routes
**File**: `src/app/api/teams/[id]/route.ts`

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Get team details
  // Check user has access
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Update team
  // Check user is owner/admin
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Delete team
  // Check user is owner
}
```

### Phase 5: Team Members (Priority: MEDIUM)

#### 5.1 Team Members Page
**File**: `src/app/teams/[id]/members/page.tsx`

Features:
- List all members
- Show roles
- Invite new members button
- Remove member (owner/admin)
- Change role (owner)

#### 5.2 Members API
**File**: `src/app/api/teams/[id]/members/route.ts`

```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Get all team members
  // Include user details
}
```

#### 5.3 Remove Member API
**File**: `src/app/api/teams/[id]/members/[memberId]/route.ts`

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
): Promise<NextResponse> {
  // Check permissions
  // Remove member
  // Cannot remove owner
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
): Promise<NextResponse> {
  // Update member role
  // Only owner can change roles
}
```

### Phase 6: Invitations (Priority: HIGH)

#### 6.1 Send Invitation API
**File**: `src/app/api/teams/[id]/invite/route.ts`

```typescript
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  // Validate email and role
  // Check user is owner/admin
  // Generate secure token
  // Create invitation in database
  // Send email with token
  // Return success
}
```

Implementation steps:
1. Parse and validate request body
2. Check user has permission to invite
3. Generate token using `generateInvitationToken()`
4. Create invitation record
5. Send email using `sendInvitationEmail()`
6. Handle errors appropriately

#### 6.2 Accept Invitation Page
**File**: `src/app/invitations/accept/page.tsx`

Features:
- Get token from URL query
- Display team information
- Accept button
- Sign in/up if not authenticated
- Handle expired tokens

#### 6.3 Accept Invitation API
**File**: `src/app/api/invitations/accept/route.ts`

```typescript
export async function POST(request: Request): Promise<NextResponse> {
  // Validate token
  // Check not expired
  // Check status is pending
  // Add user to team_members
  // Update invitation status
  // Return success
}
```

#### 6.4 Get Invitation Details API
**File**: `src/app/api/invitations/[token]/route.ts`

```typescript
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
): Promise<NextResponse> {
  // Get invitation by token
  // Check not expired
  // Return team and inviter details
  // Don't expose sensitive info
}
```

### Phase 7: UI Components (Priority: MEDIUM)

#### 7.1 Team Card
**File**: `src/components/teams/TeamCard.tsx`

Display:
- Team name
- Member count
- User's role
- Quick actions

#### 7.2 Member List
**File**: `src/components/teams/MemberList.tsx`

Display:
- Member avatar
- Name and email
- Role badge
- Actions (remove, change role)

#### 7.3 Invite Dialog
**File**: `src/components/teams/InviteDialog.tsx`

Features:
- Email input
- Role selector
- Send button
- Success/error feedback

#### 7.4 Navigation Bar
**File**: `src/components/layout/Navbar.tsx`

Features:
- Logo/brand
- Navigation links
- User menu
- Sign out button

### Phase 8: Additional Shadcn Components

Install and configure:

```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add select
npx shadcn-ui@latest add form
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
```

### Phase 9: Error Handling (Priority: MEDIUM)

#### 9.1 Error Page
**File**: `src/app/error.tsx`

Global error boundary for the application.

#### 9.2 Auth Error Page
**File**: `src/app/auth/error/page.tsx`

Display authentication errors with helpful messages.

#### 9.3 Not Found Page
**File**: `src/app/not-found.tsx`

Custom 404 page.

### Phase 10: Utilities & Helpers (Priority: LOW)

#### 10.1 API Response Helpers
**File**: `src/lib/api-response.ts`

```typescript
export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}
```

#### 10.2 Database Queries
**File**: `src/lib/queries.ts`

Common database queries:
- Get user by email
- Get user teams
- Get team by ID
- Check team membership
- etc.

#### 10.3 Permission Checks
**File**: `src/lib/permissions.ts`

```typescript
export async function checkTeamAccess(userId: string, teamId: string): Promise<boolean>
export async function checkTeamAdmin(userId: string, teamId: string): Promise<boolean>
export async function checkTeamOwner(userId: string, teamId: string): Promise<boolean>
```

## 🎨 UI/UX Considerations

### Design Tokens
- Use consistent spacing (Tailwind's spacing scale)
- Maintain color consistency (use CSS variables)
- Ensure responsive design (mobile-first)
- Add loading states
- Include empty states

### Accessibility
- Proper ARIA labels
- Keyboard navigation
- Focus indicators
- Screen reader support
- Color contrast compliance

### User Feedback
- Toast notifications for actions
- Loading spinners
- Error messages
- Success confirmations
- Inline validation

## 🧪 Testing Strategy

### Unit Tests (Recommended)
- Validation schemas
- Security utilities
- Email templates

### Integration Tests (Recommended)
- API routes
- Database queries
- Authentication flow

### E2E Tests (Optional)
- Complete user journeys
- Sign up → Create team → Invite member
- Accept invitation flow

## 📊 Monitoring & Logging (Production)

### Error Tracking
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Custom error logging

### Analytics
Consider adding:
- PostHog for product analytics
- Google Analytics
- Custom event tracking

## 🚀 Deployment Checklist

Before deploying:

- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] SMTP credentials configured
- [ ] HTTPS enabled
- [ ] Custom domain configured (optional)
- [ ] Security headers verified
- [ ] Error tracking setup
- [ ] Monitoring configured

## 📈 Performance Optimization

### Code Splitting
- Use dynamic imports for heavy components
- Lazy load routes
- Split by route

### Image Optimization
- Use Next.js Image component
- Optimize images
- Use appropriate formats (WebP)

### Caching
- Implement request caching
- Use React Query for data fetching
- Cache static assets

## 🔄 Iterative Development

### Week 1
- [ ] Authentication UI and API
- [ ] Middleware for protected routes
- [ ] Basic dashboard

### Week 2
- [ ] Team creation and listing
- [ ] Team detail page
- [ ] Team CRUD operations

### Week 3
- [ ] Member management
- [ ] Invitation system
- [ ] Email sending

### Week 4
- [ ] Polish UI/UX
- [ ] Add error handling
- [ ] Testing
- [ ] Documentation updates

## 💡 Tips for Success

1. **Start Small**: Implement one feature completely before moving to the next
2. **Test Early**: Test each endpoint as you build it
3. **Use TypeScript**: Let types guide your implementation
4. **Follow the Schema**: Reference `src/db/schema.ts` for data structure
5. **Check Security**: Use validation schemas on all inputs
6. **Read the Docs**: NextAuth, Drizzle, and Shadcn docs are excellent
7. **Commit Often**: Small, focused commits
8. **Ask for Help**: Use the documentation provided

## 🎯 Priority Order

1. **Critical Path** (Do First):
   - Authentication (Sign Up, Sign In)
   - Create Team
   - Invite Members

2. **Core Features** (Do Second):
   - Team Management
   - Member Management
   - Accept Invitations

3. **Nice to Have** (Do Later):
   - Advanced UI features
   - Animations
   - Extra validations
   - Performance optimizations

## 📞 Need Help?

- **Authentication Issues**: Check NextAuth.js docs
- **Database Issues**: Check Drizzle ORM docs
- **UI Issues**: Check Shadcn/ui docs
- **Email Issues**: Check NodeMailer docs
- **TypeScript Issues**: Check the type definitions
- **General Issues**: Review the security and setup guides

---

## ✅ Success Criteria

Module 1 is complete when:

- [ ] Users can sign up and sign in
- [ ] Users can create teams
- [ ] Team owners can invite members via email
- [ ] Invited users receive emails
- [ ] Users can accept invitations
- [ ] Team members can view team details
- [ ] Owners/Admins can manage members
- [ ] All features work without TypeScript errors
- [ ] Code passes ESLint checks
- [ ] Security best practices are followed

**Once complete, you'll have a fully functional team management system ready for Module 2 (Stripe integration)!**

Good luck! 🚀
