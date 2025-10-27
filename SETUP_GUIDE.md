# Setup Guide - Team Manager

This guide will walk you through setting up the project from scratch.

## 📋 Prerequisites Checklist

Before you begin, make sure you have:

- ✅ Node.js 18.x or later installed
- ✅ npm (comes with Node.js)
- ✅ A Neon Postgres account ([sign up here](https://neon.tech))
- ✅ SMTP credentials (Gmail, SendGrid, or any SMTP provider)
- ✅ Git installed

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd nextjs-team-manager
npm install
```

This will install all required dependencies including:

- Next.js, React, TypeScript
- Drizzle ORM, Neon serverless driver
- NextAuth.js for authentication
- Shadcn/ui components
- All dev dependencies (ESLint, Prettier, Husky)

### Step 2: Create Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Sign in or create an account
3. Click "Create Project"
4. Choose a project name (e.g., "team-manager-dev")
5. Select your region
6. Click "Create Project"
7. Copy the connection string (it looks like: `postgresql://user:password@host/database?sslmode=require`)

### Step 3: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Open `.env` and fill in your values:

```env
# Database - Paste your Neon connection string
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# NextAuth Secret - Generate with: openssl rand -base64 32
# Or use any string 32+ characters long
NEXTAUTH_SECRET=your-generated-secret-here

# NextAuth URL - Use localhost for development
NEXTAUTH_URL=http://localhost:3000

# Email Configuration
# For Gmail:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM=noreply@yourdomain.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### Step 4: Generate NextAuth Secret

Generate a secure secret for NextAuth:

**On macOS/Linux:**

```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and paste it as your `NEXTAUTH_SECRET` in `.env`

### Step 5: Setup Gmail App Password (If using Gmail)

1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification (if not already enabled)
4. Under "Signing in to Google", click "App passwords"
5. Select "Mail" and "Other (Custom name)"
6. Name it "Team Manager"
7. Click "Generate"
8. Copy the 16-character password
9. Paste it as `SMTP_PASSWORD` in your `.env` file

**Alternative SMTP Providers:**

**SendGrid:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-smtp-username
SMTP_PASSWORD=your-mailgun-smtp-password
```

### Step 6: Setup Database Schema

Run the following commands to setup your database:

```bash
# Generate migration files from schema
npm run db:generate

# Push schema to database
npm run db:push
```

**Optional:** View your database in Drizzle Studio:

```bash
npm run db:studio
```

This will open a browser window at `https://local.drizzle.studio`

### Step 7: Initialize Git Hooks

Setup Husky for pre-commit checks:

```bash
npm run prepare
```

This sets up:

- Automatic linting before commits
- Type checking before commits
- Code formatting before commits

### Step 8: Verify Setup

Run type checking to ensure everything is configured correctly:

```bash
npm run type-check
```

If you see "No errors found", you're good to go! ✅

### Step 9: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

You should see the home page! 🎉

## 🧪 Testing the Setup

### Test 1: Sign Up

1. Click "Get Started" or "Sign Up"
2. Create an account
3. Verify you can sign in

### Test 2: Create a Team

1. After signing in, navigate to teams
2. Create a new team
3. Add team details

### Test 3: Invite a Member

1. In your team, click "Invite Member"
2. Enter an email address (use a real one you can access)
3. Check that email for the invitation
4. Click the invitation link
5. Verify the invitation works

## 🔧 Troubleshooting

### Issue: Database Connection Failed

**Error:** `Error: getaddrinfo ENOTFOUND`

**Solution:**

- Verify your `DATABASE_URL` is correct
- Check if your IP is allowed in Neon (Neon allows all IPs by default)
- Ensure `?sslmode=require` is at the end of the connection string

### Issue: Email Not Sending

**Error:** `Error: Invalid login`

**Solution:**

- For Gmail, make sure you're using an App Password, not your account password
- Verify 2FA is enabled on your Gmail account
- Check SMTP_HOST and SMTP_PORT are correct
- Try a different SMTP provider

### Issue: TypeScript Errors

**Error:** Various TypeScript errors

**Solution:**

```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Clear Next.js cache
rm -rf .next

# Run type check
npm run type-check
```

### Issue: ESLint Errors

**Error:** ESLint errors on commit

**Solution:**

```bash
# Fix auto-fixable issues
npm run lint:fix

# Check what needs manual fixing
npm run lint
```

### Issue: Environment Variables Not Loading

**Error:** `ZodError: Invalid environment variables`

**Solution:**

- Make sure `.env` file exists in project root
- Check all required variables are set
- Restart the development server
- Verify no extra spaces in `.env` file

## 📚 Next Steps

After successful setup:

1. **Customize the UI**: Edit components in `src/components/`
2. **Add Features**: Create new API routes in `src/app/api/`
3. **Setup Production**: Follow deployment guide in README.md
4. **Add Shadcn Components**: Run `npx shadcn-ui@latest add [component-name]`

## 🛡️ Security Checklist

Before deploying to production:

- [ ] Change all default secrets
- [ ] Use production database credentials
- [ ] Enable HTTPS
- [ ] Review security headers in `next.config.js`
- [ ] Set up rate limiting
- [ ] Enable monitoring and logging
- [ ] Review CORS settings
- [ ] Audit dependencies: `npm audit`

## 📖 Useful Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run start              # Start production build locally

# Database
npm run db:generate        # Generate migrations
npm run db:push           # Push schema to database
npm run db:studio         # Open database GUI

# Code Quality
npm run lint              # Check for errors
npm run lint:fix          # Fix auto-fixable errors
npm run type-check        # Check TypeScript
npm run format            # Format all files
npm run format:check      # Check formatting

# Adding Shadcn Components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add toast
```

## 🆘 Getting Help

If you encounter issues:

1. Check this guide first
2. Review error messages carefully
3. Check the main README.md
4. Search for the error online
5. Open an issue on GitHub

## 🎉 Success!

If you've made it here and everything is working:

- Development server is running ✅
- Database is connected ✅
- Emails are sending ✅
- TypeScript is happy ✅

You're ready to start building! 🚀

---

**Note:** Keep your `.env` file secure and never commit it to version control.
