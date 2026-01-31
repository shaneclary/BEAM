# BEAM Website

A modern, elegant website for BEAM - helping small businesses build their digital presence.

Built with Next.js 14, Tailwind CSS, Supabase, and Resend.

## Features

- **Elegant Design** - Clean, modern UI with smooth animations
- **Responsive** - Works beautifully on all devices
- **Multi-language** - LibreTranslate integration for 10+ languages
- **Contact Form** - Submissions saved to Supabase with email notifications
- **SEO Optimized** - Proper meta tags and semantic HTML
- **Fast** - Optimized for Core Web Vitals

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Email**: Resend
- **Translation**: LibreTranslate
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Deployment**: Vercel

## Quick Start

### 1. Install Dependencies

```bash
cd site
npm install
```

### 2. Set Up Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
RESEND_API_KEY=re_your-api-key
CONTACT_EMAIL=hello@beam.dev
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the contents of `supabase-schema.sql`
4. Copy your project URL and anon key to `.env.local`

### 4. Set Up Resend

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your domain
3. Create an API key
4. Add to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Or use the Vercel CLI:

```bash
npm i -g vercel
vercel
```

### Environment Variables in Vercel

Add these in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_EMAIL` | Email to receive contact notifications |
| `NEXT_PUBLIC_LIBRETRANSLATE_URL` | (Optional) Self-hosted LibreTranslate URL |

## Project Structure

```
site/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── contact/
│   │   │       └── route.ts      # Contact form API
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Homepage
│   │
│   ├── components/
│   │   ├── Contact.tsx           # Contact form
│   │   ├── CTA.tsx               # Call to action section
│   │   ├── Features.tsx          # Features section
│   │   ├── Footer.tsx            # Site footer
│   │   ├── Hero.tsx              # Hero section
│   │   ├── LanguageSelector.tsx  # Translation dropdown
│   │   ├── Navbar.tsx            # Navigation
│   │   ├── Process.tsx           # Process section
│   │   ├── Services.tsx          # Services section
│   │   └── Testimonials.tsx      # Testimonials section
│   │
│   └── lib/
│       ├── resend.ts             # Email utilities
│       └── supabase.ts           # Database utilities
│
├── supabase-schema.sql           # Database schema
├── tailwind.config.ts            # Tailwind configuration
├── vercel.json                   # Vercel configuration
└── package.json
```

## Customization

### Colors

Edit `tailwind.config.ts` to change the brand colors:

```ts
colors: {
  beam: {
    500: '#0c8ee6',  // Primary blue
    // ...
  },
  accent: {
    500: '#d946ef',  // Accent purple
    // ...
  },
}
```

### Content

Edit the component files in `src/components/` to update text, services, testimonials, etc.

### Contact Email Template

Edit `src/lib/resend.ts` to customize the email templates.

## Translation

The site includes LibreTranslate integration for automatic translation. By default, it uses the public API at `libretranslate.com`.

For production, consider self-hosting LibreTranslate:

```bash
docker run -ti --rm -p 5000:5000 libretranslate/libretranslate
```

Then update your env:
```env
NEXT_PUBLIC_LIBRETRANSLATE_URL=http://localhost:5000
```

## License

MIT
