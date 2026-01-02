# Access Home Care (Static Draft)

This is a fast, static front-end draft intended to be deployed on Netlify.
Later, pages/services/team/etc. can be wired to the ServiceUp backend.

## Deploy (simple)
**Option A (recommended):**
- In Netlify: set **Base directory** = `site`
- **Publish directory** = `site` (or `.` if base dir is `site`)
- No build command needed

## Forms
This draft uses **Netlify Forms**:
- `request-care`
- `contact`
- `employment-application`

After deploy, enable notifications + spam protection in Netlify.

## Where to edit
- Global styles: `assets/css/styles.css`
- JS (reveal + mobile menu): `assets/js/main.js`
- Images: `assets/images/`

## SEO
- `sitemap.xml` and `robots.txt` included.
- Replace `https://accesshomecare.com` with the real domain when ready.
