# Deployment Guide

## Deploying to Vercel

### Option 1: Using Vercel CLI (Recommended for first deployment)

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
# or use npx: npx vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy from project root**:
```bash
cd /Users/admin/Documents/ReceiptVault
vercel
```

4. **Follow the prompts**:
   - Link to existing project or create new
   - Confirm project settings
   - Deploy!

5. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add all variables from `.env.example`:
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL`
     - `GOOGLE_APPLICATION_CREDENTIALS` (or use Vercel's environment variable for the JSON content)
     - `GOOGLE_CLOUD_PROJECT_ID`
     - AWS credentials (if using S3)
     - Email service credentials

### Option 2: Using Git Integration (Recommended for ongoing deployments)

1. **Push to GitHub/GitLab/Bitbucket**:
```bash
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Import project in Vercel**:
   - Go to https://vercel.com/new
   - Import your Git repository
   - Configure project settings
   - Add environment variables
   - Deploy!

3. **Automatic deployments**:
   - Every push to `main` will trigger a production deployment
   - Pull requests will create preview deployments

### Option 3: Using Vercel MCP

The Vercel MCP can be used to deploy directly. Make sure you have:
- Git repository initialized
- All files committed
- Environment variables ready

## Environment Variables Setup

### Required Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"

# NextAuth
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Google Cloud Vision (OCR)
GOOGLE_APPLICATION_CREDENTIALS="base64-encoded-json-or-path"
GOOGLE_CLOUD_PROJECT_ID="your-project-id"

# AWS S3 (Optional - for file storage)
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Database Setup

### Option 1: Vercel Postgres

1. Go to Vercel Dashboard → Storage → Create Database
2. Select Postgres
3. Copy the connection string to `DATABASE_URL`
4. Run migrations:
```bash
npx prisma migrate deploy
```

### Option 2: External PostgreSQL (Supabase, Neon, etc.)

1. Create a PostgreSQL database
2. Get connection string
3. Add to `DATABASE_URL`
4. Run migrations:
```bash
npx prisma migrate deploy
```

## Post-Deployment Steps

1. **Run database migrations**:
```bash
npx prisma migrate deploy
```

2. **Verify deployment**:
   - Visit your Vercel URL
   - Test sign up/sign in
   - Upload a test receipt
   - Verify OCR extraction

3. **Set up email forwarding** (if using):
   - Configure email service (SendGrid, Mailgun, etc.)
   - Set webhook to `/api/email/forward`
   - Test forwarding receipts

4. **Configure integrations**:
   - Set up OAuth for Gmail/Outlook (if using)
   - Configure QuickBooks/Xero integrations
   - Test integration flows

## Troubleshooting

### Build Errors

- Check Node.js version (should be 18+)
- Verify all environment variables are set
- Check build logs in Vercel dashboard

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database allows connections from Vercel IPs
- Ensure SSL is enabled if required

### OCR Not Working

- Verify Google Cloud credentials
- Check `GOOGLE_CLOUD_PROJECT_ID` is set
- Verify billing is enabled on Google Cloud project

### File Upload Issues

- Check AWS S3 credentials (if using S3)
- Verify bucket permissions
- For development, files may be stored locally

## Monitoring

- Check Vercel Analytics for performance
- Monitor error logs in Vercel dashboard
- Set up alerts for critical errors
- Monitor database usage and performance

## Scaling

- Vercel automatically scales based on traffic
- Database: Upgrade plan if needed
- S3: Pay-as-you-go, scales automatically
- Google Cloud Vision: Pay-per-use

## Security Checklist

- [ ] All environment variables are set
- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] Database connection uses SSL
- [ ] API routes are protected with authentication
- [ ] File uploads are validated
- [ ] CORS is properly configured
- [ ] Rate limiting is in place (consider adding)

## Support

For deployment issues:
- Check Vercel documentation: https://vercel.com/docs
- Review build logs in Vercel dashboard
- Check Next.js deployment guide: https://nextjs.org/docs/deployment

