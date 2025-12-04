# Quick Deploy Instructions

## Your Repository
✅ **Pushed to GitHub**: https://github.com/hamzaparvez-dev/reciept-vault

## Deploy to Vercel

### Method 1: Vercel Dashboard (Easiest)
1. Visit: https://vercel.com/new
2. Import: `hamzaparvez-dev/reciept-vault`
3. Configure environment variables
4. Deploy!

### Method 2: Vercel CLI
```bash
cd /Users/admin/Documents/ReceiptVault
npx vercel
```

Follow the prompts to link/create project.

## Required Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-app.vercel.app
GOOGLE_APPLICATION_CREDENTIALS=...
GOOGLE_CLOUD_PROJECT_ID=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=...
```

## After Deployment

1. **Set up database**:
   - Use Vercel Postgres (recommended) or external DB
   - Run: `npx prisma migrate deploy`

2. **Test the app**:
   - Visit your Vercel URL
   - Sign up/Sign in
   - Upload a test receipt

3. **Configure integrations** (optional):
   - Gmail/Outlook OAuth
   - QuickBooks/Xero
   - Email forwarding

## Need Help?

- Check `DEPLOYMENT.md` for detailed instructions
- Check `SETUP.md` for local development setup
- Check `README.md` for feature overview

