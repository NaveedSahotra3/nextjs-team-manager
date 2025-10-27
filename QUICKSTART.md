# Quick Start Guide

Get your project running in 5 minutes! ⚡

## 📦 1. Install Dependencies (1 min)

```bash
cd nextjs-team-manager
npm install
```

## 🔐 2. Setup Environment (2 min)

```bash
# Copy example env file
cp .env.example .env

# Generate NextAuth secret
openssl rand -base64 32

# Edit .env and add:
# - Your Neon database URL
# - The generated NextAuth secret
# - Your SMTP credentials
```

## 🗄️ 3. Setup Database (1 min)

```bash
# Push schema to database
npm run db:push

# (Optional) View database
npm run db:studio
```

## 🔧 4. Initialize Git Hooks (30 sec)

```bash
npm run prepare
```

## 🚀 5. Start Development (30 sec)

```bash
npm run dev
```

Visit: http://localhost:3000

## ✅ Verify Setup

```bash
# Should show no errors
npm run type-check

# Should show no errors
npm run lint
```

## 🎯 Quick Reference

### Essential Commands

```bash
# Development
npm run dev                 # Start dev server (http://localhost:3000)
npm run build              # Build for production
npm run start              # Start production server

# Database
npm run db:push           # Apply schema changes
npm run db:studio         # Visual database editor
npm run db:generate       # Generate migration files

# Code Quality
npm run lint              # Check for errors
npm run lint:fix          # Auto-fix errors
npm run type-check        # TypeScript validation
npm run format            # Format all files

# Add UI Components
npx shadcn-ui@latest add [component-name]
```

### Environment Variables Template

```env
# Database (from Neon)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Auth (generate: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Gmail App Password Setup

1. Google Account → Security
2. Enable 2-Step Verification
3. App passwords → Generate
4. Copy password to `.env`

## 📂 Project Structure

```
src/
├── app/              # Pages (Next.js App Router)
├── components/       # React components
├── db/              # Database (schema + connection)
├── lib/             # Utilities (auth, email, security)
└── types/           # TypeScript definitions
```

## 🔨 What to Build Next

See `IMPLEMENTATION_GUIDE.md` for detailed steps.

**Priority Order:**

1. Auth pages (sign up/sign in)
2. API routes (auth, teams)
3. Dashboard & team management
4. Invitation system

## 📚 Documentation

- **README.md** - Main documentation
- **SETUP_GUIDE.md** - Detailed setup
- **SECURITY.md** - Security features
- **IMPLEMENTATION_GUIDE.md** - What to build next
- **PROJECT_SUMMARY.md** - Complete overview

## 🆘 Common Issues

### Database Connection Failed

- Check DATABASE_URL format
- Ensure `?sslmode=require` at end
- Verify Neon project is active

### Email Not Sending

- Use Gmail App Password (not account password)
- Enable 2FA first
- Check SMTP_HOST and SMTP_PORT

### TypeScript Errors

```bash
rm -rf node_modules .next
npm install
npm run type-check
```

## ✨ Tips

- Start with auth implementation first
- Use `npm run type-check` frequently
- Let ESLint guide you (pre-commit hooks help!)
- Read inline code comments
- Check existing schemas before creating new ones

## 🎉 You're Ready!

Everything is configured. Now start building! 🚀

**Next Step**: Open `IMPLEMENTATION_GUIDE.md` and start with Phase 1 (Authentication).
