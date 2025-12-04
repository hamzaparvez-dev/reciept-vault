# Setup Instructions

## Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up database**:
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (for development)
npx prisma db push

# Or run migrations (for production)
npx prisma migrate dev
```

4. **Run development server**:
```bash
npm run dev
```

5. **Open browser**:
```
http://localhost:3000
```

## Environment Variables

See `.env.example` for all required variables. Key ones:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: `http://localhost:3000` for local dev
- Google Cloud credentials for OCR
- AWS credentials for S3 (optional for local dev)

## Database Setup

### Local PostgreSQL

1. Install PostgreSQL
2. Create database:
```sql
CREATE DATABASE receiptvault;
```
3. Update `DATABASE_URL` in `.env`

### Cloud Database Options

- **Supabase**: Free tier available
- **Neon**: Serverless Postgres
- **Vercel Postgres**: Integrated with Vercel
- **Railway**: Easy setup

## Google Cloud Vision Setup

1. Create a Google Cloud project
2. Enable Vision API
3. Create service account
4. Download credentials JSON
5. Set `GOOGLE_APPLICATION_CREDENTIALS` to path or base64 encode for Vercel

## AWS S3 Setup (Optional)

For local development, files can be stored in `public/uploads`. For production:

1. Create S3 bucket
2. Get access keys
3. Set environment variables
4. Configure bucket CORS if needed

## Testing

1. Sign up/Sign in
2. Upload a test receipt (JPG, PNG, or PDF)
3. Verify OCR extraction
4. Check categorization
5. Generate a report

## Common Issues

### Prisma Client Not Generated
```bash
npx prisma generate
```

### Database Connection Error
- Check `DATABASE_URL` format
- Verify database is running
- Check network/firewall settings

### OCR Not Working
- Verify Google Cloud credentials
- Check API is enabled
- Verify billing is enabled

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Next Steps

- Set up email forwarding
- Configure integrations
- Customize categories
- Set up warranty tracking
- Deploy to production

See `DEPLOYMENT.md` for deployment instructions.

