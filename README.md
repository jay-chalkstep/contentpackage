# Asset Studio

A simple, single-user design tool for logo management, template creation, and mockup generation.

## Features

- **Logo Search**: Search and save logos using the Brandfetch API
- **Logo Library**: Manage your saved logos with download and organization features
- **Upload Logo**: Add custom logos to your library
- **Asset Designer**: Create mockups using logos and templates with a canvas editor
- **Template Library**: Browse and manage design templates
- **Upload Template**: Add custom templates for mockup creation
- **Mockup Library**: View and manage all created mockups

## Tech Stack

- **Framework**: Next.js 15.5.5 with App Router and Turbopack
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **Canvas**: Konva.js + React-Konva
- **Icons**: Lucide React
- **Language**: TypeScript

## Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Brandfetch API key

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_BRANDFETCH_API_KEY` - Get from [Brandfetch](https://brandfetch.com)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

### Database Setup

1. Create a new Supabase project
2. Run the SQL migrations in order:
   - `supabase/SIMPLIFY_TO_SINGLE_USER.sql` - Sets up the simplified schema
   - `supabase_storage_setup.sql` - Creates storage buckets

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/asset-studio)

1. Click the button above or import your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_BRANDFETCH_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy!

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (dashboard)/       # Dashboard routes with sidebar layout
│   ├── api/               # API routes
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utilities and configurations
│   ├── hooks/            # Custom React hooks
│   ├── supabase/         # Supabase client
│   └── utils/            # Utility functions
├── public/               # Static assets
└── supabase/            # Database migrations and setup
```

## License

MIT