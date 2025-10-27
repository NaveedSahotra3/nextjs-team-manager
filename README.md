# Next.js Team Manager

A production-ready Next.js application with team management, authentication, and invitation system built with strict TypeScript, security best practices, and modern tooling.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Neon Postgres with Drizzle ORM
- **Authentication**: NextAuth.js v4
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Email**: NodeMailer
- **Validation**: Zod
- **Type Safety**: TypeScript (Strict Mode)
- **Code Quality**: ESLint + Prettier + Husky
- **Deployment**: Vercel

## ✨ Features

### Module 1 (Current)
- ✅ User Authentication (Sign up, Sign in, Session management)
- ✅ Team Creation and Management
- ✅ Team Member Invitations via Email
- ✅ Role-Based Access Control (Owner, Admin, Member)
- ✅ Secure Password Hashing (bcrypt)
- ✅ Email Invitations with Token-based Validation
- ✅ Type-safe Environment Variables

### Module 2 (Upcoming)
- 🔜 Stripe Integration for Credits
- 🔜 Credit Distribution System
- 🔜 Connection Sharing Between Team Members

## 🔒 Security Features

- Strict TypeScript with no `any` types
- Comprehensive ESLint security rules
- OWASP security headers
- SQL injection protection (Drizzle ORM)
- XSS protection
- CSRF protection
- Secure password hashing (bcrypt with salt rounds: 12)
- Token-based invitation system
- Environment variable validation
- Rate limiting ready (add implementation)
- Content Security Policy (CSP)
- Secure session management

## 📋 Prerequisites

- Node.js 18.x or later
- npm or yarn
- Neon Postgres account
- SMTP server credentials (Gmail, SendGrid, etc.)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Fill in your environment variables:

```env
# Database (Get from Neon Console)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# NextAuth (Generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-key-min-32-characters-long
NEXTAUTH_URL=http://localhost:3000

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Database Setup

#### Create Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string
4. Add it to your `.env` file

#### Run Migrations

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:push

# Optional: Open Drizzle Studio to view your database
npm run db:studio
```

### 4. Setup Husky (Git Hooks)

```bash
npm run prepare
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📝 Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run type-check       # Run TypeScript compiler
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Database
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:push          # Push schema changes
npm run db:studio        # Open Drizzle Studio

# Git Hooks
npm run prepare          # Setup Husky
npm run pre-commit       # Run pre-commit checks
```

## 🏗️ Project Structure

```
nextjs-team-manager/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── teams/          # Team management pages
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   └── ui/             # Shadcn UI components
│   ├── db/
│   │   ├── schema.ts       # Database schema
│   │   ├── index.ts        # Database connection
│   │   └── migrations/     # Migration files
│   ├── lib/
│   │   ├── auth.ts         # NextAuth configuration
│   │   ├── email.ts        # Email utilities
│   │   ├── security.ts     # Security utilities
│   │   ├── validations.ts  # Zod schemas
│   │   └── utils.ts        # Utility functions
│   ├── types/              # TypeScript types
│   └── env.ts              # Environment validation
├── .husky/                 # Git hooks
├── .eslintrc.json         # ESLint configuration
├── .prettierrc            # Prettier configuration
├── tsconfig.json          # TypeScript configuration
├── next.config.js         # Next.js configuration
├── tailwind.config.js     # Tailwind configuration
└── drizzle.config.ts      # Drizzle configuration
```

## 🔐 Environment Variables

All environment variables are validated at runtime using `@t3-oss/env-nextjs` and Zod schemas.

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon Postgres connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js (min 32 chars) | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `SMTP_HOST` | SMTP server hostname | Yes |
| `SMTP_PORT` | SMTP server port | Yes |
| `SMTP_USER` | SMTP username | Yes |
| `SMTP_PASSWORD` | SMTP password | Yes |
| `SMTP_FROM` | From email address | Yes |
| `NEXT_PUBLIC_APP_URL` | Public application URL | Yes |

## 📧 Email Configuration

### Gmail Setup

1. Enable 2-Factor Authentication
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `SMTP_PASSWORD`

### SendGrid Setup

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

## 🧪 Code Quality

This project enforces strict code quality standards:

- **TypeScript**: Strict mode with no implicit any
- **ESLint**: Security rules, React hooks, import ordering
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for linting and type checking
- **Lint-staged**: Only lint staged files

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables in Production

Make sure to set all environment variables in your hosting provider:
- Update `NEXTAUTH_URL` to your production domain
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- Use production database credentials
- Use production SMTP credentials

## 📖 API Routes

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in user

### Teams
- `GET /api/teams` - Get user's teams
- `POST /api/teams` - Create new team
- `GET /api/teams/[id]` - Get team details
- `PATCH /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team

### Team Members
- `GET /api/teams/[id]/members` - Get team members
- `POST /api/teams/[id]/invite` - Invite member
- `DELETE /api/teams/[id]/members/[memberId]` - Remove member
- `PATCH /api/teams/[id]/members/[memberId]` - Update member role

### Invitations
- `POST /api/invitations/accept` - Accept invitation
- `GET /api/invitations/[token]` - Get invitation details

## 🛡️ Security Best Practices

1. **Never commit `.env` file**
2. **Rotate secrets regularly**
3. **Use strong passwords** (enforced by validation)
4. **Keep dependencies updated**
5. **Review security headers** in `next.config.js`
6. **Enable rate limiting** in production
7. **Use HTTPS** in production
8. **Monitor for vulnerabilities**: `npm audit`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review error logs

## 🔄 Upcoming Features (Module 2)

- Stripe payment integration
- Credit system
- Credit distribution among team members
- Connection sharing
- Team analytics
- Billing management

---

Built with ❤️ using Next.js, Neon Postgres, and TypeScript
