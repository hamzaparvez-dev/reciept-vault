# Vercel Environment Variables Setup

## ⚠️ Critical: Set These Environment Variables

Your application is failing because required environment variables are not set in Vercel.

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/hamzaparvez-dev/reciept-vault/settings/environment-variables
2. Or: Go to your project → Settings → Environment Variables

### Step 2: Add Required Variables

Add these **required** environment variables:

#### 1. Database (REQUIRED)
```
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
```

**Options:**
- **Vercel Postgres** (Recommended): 
  - Go to Vercel Dashboard → Storage → Create Database → Postgres
  - Copy the connection string
- **Supabase**: Free tier available at https://supabase.com
- **Neon**: Serverless Postgres at https://neon.tech
- **Railway**: Easy setup at https://railway.app

#### 2. NextAuth (REQUIRED)
```
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://reciept-vault.vercel.app
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Set NEXTAUTH_URL to your Vercel domain:**
- Production: `https://reciept-vault.vercel.app` (or your custom domain)
- Preview: `https://reciept-vault-git-main-hamzaparvez-dev.vercel.app`

#### 3. Google Cloud Vision (Optional - for OCR)
```
GOOGLE_APPLICATION_CREDENTIALS=base64-encoded-json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

**To get credentials:**
1. Go to Google Cloud Console
2. Create a service account
3. Download JSON key
4. Base64 encode it: `cat key.json | base64`
5. Paste the result as `GOOGLE_APPLICATION_CREDENTIALS`

#### 4. AWS S3 (Optional - for file storage)
```
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

**Note:** Without S3, files will be stored locally (not recommended for production)

### Step 3: Apply to All Environments

Make sure to select:
- ✅ Production
- ✅ Preview
- ✅ Development

### Step 4: Redeploy

After adding environment variables:
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"

Or push a new commit to trigger automatic redeploy.

### Step 5: Verify Setup

1. **Check health endpoint:**
   ```
   https://reciept-vault.vercel.app/api/health
   ```
   Should return `{"status":"ok"}`

2. **Test the app:**
   - Visit your Vercel URL
   - Try to sign up/sign in
   - Upload a test receipt

### Step 6: Run Database Migrations

After setting DATABASE_URL, run migrations:

```bash
# Locally (if you have DATABASE_URL set)
npx prisma migrate deploy

# Or use Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy
```

## Troubleshooting

### Error: "Application error: a server-side exception has occurred"

**Cause:** Missing environment variables (DATABASE_URL or NEXTAUTH_SECRET)

**Solution:** 
1. Check `/api/health` endpoint to see which variables are missing
2. Add missing variables in Vercel Dashboard
3. Redeploy

### Error: "PrismaClientInitializationError"

**Cause:** Database connection failed

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check database allows connections from Vercel IPs
3. Ensure database is running and accessible
4. For Vercel Postgres, connection string is auto-configured

### Error: "NEXTAUTH_SECRET is not set"

**Cause:** Missing NEXTAUTH_SECRET

**Solution:**
1. Generate secret: `openssl rand -base64 32`
2. Add to Vercel environment variables
3. Redeploy

## Quick Checklist

- [ ] DATABASE_URL is set
- [ ] NEXTAUTH_SECRET is set
- [ ] NEXTAUTH_URL is set to your Vercel domain
- [ ] Database migrations are run
- [ ] Health check endpoint returns OK
- [ ] App loads without errors

## Need Help?

- Check build logs in Vercel Dashboard
- Check `/api/health` endpoint for environment status
- Review server logs in Vercel Dashboard → Functions → Logs

