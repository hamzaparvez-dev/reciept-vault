# ReceiptVault

A smart receipt management and expense tracking platform that automatically extracts, categorizes, and organizes receipts from emails, photos, and forwarded messages.

## Features

- 📧 **Auto-Capture**: Forward receipts via email or connect Gmail/Outlook
- 🤖 **Smart Extraction**: AI-powered OCR extracts merchant, date, amount, and items with 95%+ accuracy
- 📊 **Auto-Categorization**: ML-based category assignment with IRS tax categories
- 🔍 **Search & Organization**: Search by merchant, date, amount, category, and tags
- 📈 **Reporting**: Generate tax-ready reports and export to CSV, PDF, or Excel
- 🔗 **Integrations**: QuickBooks, Xero, FreshBooks, Google Drive, Dropbox
- ⚠️ **Warranty Tracking**: Alerts for expiring warranties

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Storage**: AWS S3 (or local for development)
- **OCR**: Google Cloud Vision API
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Google Cloud account (for OCR)
- AWS account (for S3 storage, optional for development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ReceiptVault
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for local)
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to Google Cloud credentials JSON
- `GOOGLE_CLOUD_PROJECT_ID`: Your Google Cloud project ID
- AWS credentials (optional for development)

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ReceiptVault/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx           # Landing page
├── components/            # React components
├── lib/                   # Utility functions
│   ├── auth.ts           # NextAuth configuration
│   ├── ocr.ts            # OCR extraction
│   ├── categorization.ts # ML categorization
│   ├── prisma.ts         # Prisma client
│   └── subscription.ts   # Subscription limits
├── prisma/
│   └── schema.prisma     # Database schema
└── public/               # Static assets
```

## API Endpoints

### Receipts
- `GET /api/receipts` - List receipts with filters
- `POST /api/receipts/upload` - Upload a receipt
- `GET /api/receipts/[id]` - Get receipt details
- `PATCH /api/receipts/[id]` - Update receipt
- `DELETE /api/receipts/[id]` - Delete receipt
- `GET /api/receipts/reports` - Generate expense reports

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category

### Integrations
- `GET /api/integrations` - List integrations
- `POST /api/integrations` - Add integration
- `DELETE /api/integrations/[id]` - Remove integration

### Warranty
- `GET /api/warranty/alerts` - Get expiring warranties

## Subscription Tiers

- **Free**: 20 receipts/month, basic categorization, 1 year storage
- **Pro ($9.99/month)**: Unlimited receipts, advanced categorization, lifetime storage, 2 integrations
- **Business ($29.99/month)**: Everything in Pro, multi-user (up to 10), unlimited integrations, API access
- **Enterprise**: Custom pricing, unlimited users, SSO/SAML, white-label

## Development

### Database Migrations
```bash
npx prisma migrate dev
```

### Database Studio
```bash
npx prisma studio
```

### Build for Production
```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Or use the Vercel MCP to deploy directly.

### Environment Variables for Production

Make sure to set all required environment variables in your hosting platform:
- Database connection string
- NextAuth secret and URL
- Google Cloud credentials
- AWS credentials (if using S3)
- Email service credentials (if using email forwarding)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For support, email support@receiptvault.com or open an issue on GitHub.

