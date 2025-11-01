# Email Configuration Guide

This application supports two email providers for sending invitation emails:

## Option 1: Resend (Recommended for Vercel Deployment)

Resend is specifically built for serverless environments like Vercel and offers better reliability.

### Setup Steps:

#### **For Testing/Development (Quick Start):**

1. **Sign up for Resend**
   - Go to [https://resend.com](https://resend.com)
   - Create a free account

2. **Get Your API Key**
   - Navigate to API Keys in the Resend dashboard
   - Create a new API key
   - Copy the API key (starts with `re_`)

3. **Add to Environment Variables**

   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=onboarding@resend.dev
   ```

   **Note:** Use `onboarding@resend.dev` for testing. This is Resend's test email that works without domain verification.

4. **Deploy to Vercel** (if applicable)
   - Add the same environment variables in Vercel dashboard
   - Redeploy your application

#### **For Production (With Your Domain):**

1. **Purchase a Domain** (if you don't have one)
   - You need a domain you own (e.g., `yourdomain.com`)
   - Free domains like `vercel.app` are NOT supported by Resend

2. **Verify Domain in Resend**
   - In Resend dashboard, add your domain
   - Add the DNS records they provide (see below)
   - Wait for verification (usually takes a few minutes)

3. **Update Environment Variables**

   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Redeploy**

### Features:

- ✅ Works perfectly with Vercel serverless functions
- ✅ No timeout issues
- ✅ Better deliverability
- ✅ Simple API
- ✅ Free tier: 3,000 emails/month
- ✅ Detailed logs and analytics

---

## Option 2: SMTP (NodeMailer) - Fallback Option

Traditional SMTP can be used as a fallback or for local development.

### Setup Steps:

1. **Using Gmail (Example)**

   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=noreply@yourdomain.com
   ```

2. **Generate App Password for Gmail**
   - Go to Google Account Settings
   - Security → 2-Step Verification (must be enabled)
   - App Passwords → Generate new password
   - Use this password in `SMTP_PASSWORD`

3. **Other SMTP Providers**
   - **SendGrid**: smtp.sendgrid.net:587
   - **Mailgun**: smtp.mailgun.org:587
   - **AWS SES**: email-smtp.region.amazonaws.com:587

### Limitations:

- ⚠️ May timeout on Vercel serverless functions
- ⚠️ Less reliable for production
- ⚠️ Gmail has sending limits (500/day)
- ✅ Good for local development

---

## How It Works

The application uses a **smart fallback system**:

1. **If `RESEND_API_KEY` is configured**: Uses Resend
2. **If Resend fails or not configured**: Falls back to SMTP
3. **If both fail**: Returns error to user

### Code Flow:

```typescript
// Try Resend first
if (resend) {
  try {
    await resend.emails.send(...)
    return; // Success!
  } catch (error) {
    // Continue to SMTP fallback
  }
}

// Fallback to SMTP
await transporter.sendMail(...)
```

---

## Vercel Deployment Checklist

### For Production (Recommended):

1. ✅ Set up Resend account
2. ✅ Verify your domain in Resend
3. ✅ Add `RESEND_API_KEY` to Vercel environment variables
4. ✅ Add `SMTP_FROM` with your verified domain email
5. ✅ Deploy and test

### Alternative (SMTP Only):

1. ⚠️ Not recommended for Vercel
2. ⚠️ May experience timeouts
3. ⚠️ Use only for testing or non-Vercel deployments

---

## Testing Emails

### Local Development:

```bash
# Set up .env.local
RESEND_API_KEY=re_your_test_key
SMTP_FROM=testing@yourdomain.com
```

### Test Invitation:

1. Create a team
2. Invite a member with your email
3. Check your inbox (and spam folder)
4. Click the invitation link

---

## Troubleshooting

### "Failed to send invitation email" error

**On Vercel:**

1. Check Vercel logs: `vercel logs`
2. Ensure `RESEND_API_KEY` is set in environment variables
3. Check `RESEND_FROM_EMAIL` is set correctly:
   - For testing: `onboarding@resend.dev`
   - For production: Your verified domain email
4. Verify domain is verified in Resend dashboard (if using custom domain)

### 403 Error from Resend

**Cause:** You're using an unverified domain or `vercel.app` domain

**Solutions:**

**Option A - Quick Fix (Testing):**

```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

This uses Resend's test email and works immediately.

**Option B - Production (Custom Domain):**

1. Purchase/use a domain you own
2. Verify it in Resend dashboard
3. Update environment variable:
   ```env
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

**What NOT to use:**

- ❌ `yourapp.vercel.app`
- ❌ `herokuapp.com`
- ❌ Other free hosting domains
- ✅ Use: `onboarding@resend.dev` OR your own domain

**Locally:**

1. Check `.env.local` has correct values
2. For Gmail, ensure app password is used (not regular password)
3. Enable "Less secure app access" for Gmail (if using regular SMTP)
4. Check SMTP port is correct (587 for TLS, 465 for SSL)

### Email not received

1. **Check spam folder**
2. **Verify domain** in Resend dashboard
3. **Check Resend logs** for delivery status
4. **Test with personal email** first
5. **Check SPF/DKIM records** for your domain

### DNS Records for Domain Verification

When you add your domain to Resend, you'll need to add these DNS records:

```
Type: TXT
Name: @
Value: [provided by Resend]

Type: CNAME
Name: [provided by Resend]
Value: [provided by Resend]
```

---

## Environment Variables Reference

```env
# Resend (Primary - Recommended)
RESEND_API_KEY=re_xxxxxxxxxxxxx
# For testing (works immediately, no domain needed):
RESEND_FROM_EMAIL=onboarding@resend.dev
# For production (requires verified domain):
# RESEND_FROM_EMAIL=noreply@yourdomain.com

# SMTP (Fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

---

## Cost Comparison

| Provider       | Free Tier   | Paid Plans           | Best For              |
| -------------- | ----------- | -------------------- | --------------------- |
| **Resend**     | 3,000/month | $20/month for 50k    | Vercel/Production     |
| **Gmail SMTP** | 500/day     | N/A                  | Development only      |
| **SendGrid**   | 100/day     | $19.95/month for 50k | Alternative to Resend |

---

## Support

- **Resend Docs**: https://resend.com/docs
- **Nodemailer Docs**: https://nodemailer.com
- **Gmail SMTP Guide**: https://support.google.com/mail/answer/7126229
