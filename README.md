# Rudi & Gabriella — Wedding Invitation

A cinematic, responsive wedding invitation and private CMS built with Next.js,
Supabase, and ImageKit.

## Included

- 14 full-screen invitation states: cover plus 13 scroll-snap sections
- Database-issued, unguessable personal invitation links
- Invitee CRUD, pax allocation, and attendance tracking
- Unique full-name records with attending, pending, and skip status
- One RSVP and one wish per invitee, with privacy-safe submission fingerprints
- Wishes are published immediately in a five-comment carousel
- Downloadable XLSX template and authenticated bulk invitee import
- Public read-only invitation at `/`; personal forms only appear on secure links
- Reduced-motion-aware parallax backgrounds while scrolling
- Editable couple, date, venue, bank, and footer content
- Replaceable background image for every invitation page
- Multi-image gallery carousel with bulk ImageKit uploads
- Configurable background music upload or direct audio URL
- Dress-code artwork sourced from `public/DRESSCODE.png`
- Authenticated ImageKit uploads
- Password-protected CMS at /panel-xyz123
- Desktop split-screen and full-screen mobile layouts

## Local setup

1. Run pnpm install.
2. Copy .env.example to .env.local.
3. In Supabase SQL Editor, run supabase/schema.sql.
4. Add the Supabase service-role key, ImageKit keys, and strong panel secrets to
   .env.local.
5. Run pnpm dev.

Open the public read-only invitation at http://localhost:3000 and the CMS at
http://localhost:3000/panel-xyz123. Add an invitee to generate a private
`/invite/<secure-token>` link with RSVP and wish forms.

## Environment variables

| Variable | Purpose |
| --- | --- |
| SUPABASE_URL | Supabase project URL |
| SUPABASE_SERVICE_ROLE_KEY | Server-only database access |
| NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY | ImageKit upload public key |
| IMAGEKIT_PRIVATE_KEY | Server-only ImageKit signing key |
| NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT | ImageKit delivery endpoint |
| PANEL_PASSWORD | CMS login password |
| PANEL_SESSION_SECRET | HMAC key for the panel session cookie |
| SUBMISSION_FINGERPRINT_SECRET | HMAC key for form identity fingerprints; raw IP addresses are never stored |

Never expose the Supabase service-role key or ImageKit private key in a
NEXT_PUBLIC_ variable.

## Verification

Run pnpm lint and pnpm build.
