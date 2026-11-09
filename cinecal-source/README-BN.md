# CineCal — Cloudflare starter

This package moves CineCal off Google Apps Script. The existing calendar UI and user/admin workflows are retained; storage starts empty.

## Included
- Responsive CineCal calendar, movie date gallery, Coming Up list
- Public movie suggestions (pending approval)
- Admin login, add/edit/delete, approve/reject
- Genre multi-select and JSON backup import
- Cloudflare D1 for movie records and R2 for posters
- No Google Apps Script banner

## Important security note
The admin passcode is **not embedded in the frontend**. Set it as a Cloudflare Worker secret named `ADMIN_PASSCODE`. The initial requested value is `1234`; change it before sharing the public URL because it is weak.

## Deploy (Cloudflare free-tier services; quotas/pricing can change)
You need a Cloudflare account and Wrangler CLI on a computer with Node.js.

1. Install Wrangler and log in:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
2. Create the database and bucket:
   ```bash
   wrangler d1 create cinecal-db
   wrangler r2 bucket create cinecal-posters
   ```
3. Copy the `database_id` returned by D1 into `wrangler.toml`, replacing `REPLACE_WITH_D1_DATABASE_ID`.
4. Create the table:
   ```bash
   wrangler d1 execute cinecal-db --remote --file=./schema.sql
   ```
5. Set the admin secret (the value is entered in your terminal, not saved in this source code):
   ```bash
   wrangler secret put ADMIN_PASSCODE
   ```
   Enter `1234` for the first test deployment, then change it to a stronger private passcode before public launch.
6. Deploy:
   ```bash
   wrangler deploy
   ```

The first deploy gives you a `*.workers.dev` address. You can attach a custom domain such as `cinecal.com` later from the Cloudflare dashboard after buying/connecting the domain.

## Local preview
```bash
npm install -g wrangler
wrangler dev
```

## Notes
- Poster upload is resized by the existing browser code and limited to 300 KB by the Worker.
- The app polls for updates every 60 seconds, matching the previous version.
- All API calls are same-origin HTTPS; no Google Apps Script client bridge remains.
- The D1 database is empty until movies are added or suggestions are approved.
