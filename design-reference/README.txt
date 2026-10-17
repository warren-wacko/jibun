NFC DIGITAL CARD TEMPLATES - EXPORT
===================================

Each template has two packages, each its own folder:

  01-pro-classic/        starter/  standard/
  02-pro-magazine/       starter/  standard/
  03-pro-signature/      starter/  standard/
  04-pro-company/        starter/  standard/
  05-student-notebook/   starter/  standard/
  06-social-bento/       starter/  standard/
  07-social-scrapbook/   starter/  standard/
  08-social-minimalist/  starter/  standard/

Every package folder is self-contained:
  index.html          the card page
  assets/photo.jpg    the profile photo

TO MAKE A CARD FOR A CLIENT
1. Copy the package folder (e.g. 04-pro-company/standard) and rename it.
2. Replace assets/photo.jpg with the client's photo (same file name).
3. In index.html:
   - Edit the "dc-contact" block near the top of <body>. This is what
     "Save contact" downloads into the visitor's phone (.vcf).
     Leave "website" empty to use the card's own link.
   - Edit the visible text, links and placeholders inside <template id="dc-template">
     (name, title, bio, +63 9XX..., hello@..., linkedin.com/in/yourname, etc.).
   - Defaults (theme, colors, fonts, section order) are in the "dc-props" block.
4. Upload the folder to any static host (Netlify, Vercel, GitHub Pages,
   Cloudflare Pages). Use HTTPS so copy-to-clipboard and sharing work.
5. Write the page URL to the NFC tag. The QR code on the card
   automatically encodes the page's own URL.

Notes
- Fonts load from Google Fonts, so the page needs internet the first time.
- Open index.html through a web server, not by double-clicking it, or the
  vCard photo won't be attached.
