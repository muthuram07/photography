# photography

3D photography portfolio built with Next.js, Tailwind, and Cloudinary.

## Local setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill values:
```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_PORTFOLIO_FOLDER=
CLOUDINARY_MAX_IMAGES=30
```

3. Run:
```bash
npm run dev -- --port 3010
```

## Vercel environment variables

In Vercel project settings, add these Environment Variables (Production/Preview/Development as needed):
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_PORTFOLIO_FOLDER` (optional, leave empty for root)
- `CLOUDINARY_MAX_IMAGES` (optional, recommended 20-40 for faster load)

Then redeploy.

## Notes

- Cloudinary credentials are read at runtime in `app/api/gallery-images/route.ts`.
- API route is configured as Node runtime and forced dynamic for server-side env usage on Vercel.
