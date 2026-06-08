# Chrome Web Store submission — step by step

Everything technical is prepped. The remaining steps need your Google account.

## 0. One-time setup (~10 min, costs $5)

1. Go to the **Chrome Web Store Developer Dashboard**:
   https://chrome.google.com/webstore/devconsole
2. Sign in with the Google account you want to own the extension.
3. Pay the **one-time $5 registration fee** (lifetime, covers up to 20 items).
4. Complete the developer account details it asks for (contact email, etc.).

## 1. Host the privacy policy

The dashboard requires a public privacy policy URL.

1. Commit and push `PRIVACY.md` to GitHub (see git steps at the bottom).
2. Your URL will be:
   `https://github.com/hfeliz03/LeetNoise/blob/main/PRIVACY.md`
   (Paste this into the Privacy practices tab.)

## 2. Create the listing

1. In the dashboard, click **Add new item**.
2. Upload **`leetnoise-v1.0.zip`** (built in the repo root — see below).
3. Fill the **Store listing** tab from `store/STORE_LISTING.md`:
   - Name, summary, detailed description, category, language.
   - Upload at least **one screenshot** (1280×800 or 640×400). This is the only
     asset you must capture by hand — see the asset table in STORE_LISTING.md.
4. Fill the **Privacy practices** tab:
   - Single-purpose description (provided in STORE_LISTING.md).
   - Justify each permission (text provided).
   - Data-usage disclosures (answers provided).
   - Privacy policy URL from step 1.
5. **Distribution**: choose Public (or Unlisted if you only want people with the
   link to find it — good for a soft launch).

## 3. Submit

1. Click **Submit for review**.
2. Review typically takes a few hours to a few days. You'll get an email on
   approval or if changes are requested.
3. Once approved, your public listing URL is shareable and shows in search.

## 4. After approval

- Track **weekly active users** and installs in the dashboard's stats.
- Star ratings and reviews appear on the listing automatically.
- User feedback also flows to your Google Form (linked in the popup).

## Shipping updates later

1. Bump `"version"` in `manifest.json` (e.g. `1.0` → `1.1`).
2. Rebuild the ZIP: `bash store/build-zip.sh` (or the zip command below).
3. In the dashboard, open the item → **Package** → upload the new ZIP →
   submit for review.

---

## Rebuilding the ZIP manually

From the repo root:

```
rm -f leetnoise-v1.0.zip
zip -r leetnoise-v1.0.zip . \
  -x ".git/*" ".gitignore" "CLAUDE.md" "store/*" \
     "*.DS_Store" "leetnoise-*.zip" "PRIVACY.md" \
     "assets/LeetNoise.png" "assets/logo.png"
```

The ZIP intentionally excludes dev/repo files (`.git`, `CLAUDE.md`, the `store/`
prep folder, the privacy policy markdown) and the master art `assets/LeetNoise.png`
+ `assets/logo.png` (kept in the repo only as the sources the sized icons are
generated from). It keeps everything Chrome actually loads at runtime.

## Git: push the privacy policy + feedback link

```
git checkout -b store-prep
git add PRIVACY.md popup.html store/
git commit -m "Add privacy policy, feedback link, and store submission assets"
git push -u origin store-prep
```

Then merge to `main` (the privacy policy URL above points at `main`).
