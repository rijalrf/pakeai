# 📦 Persiapan Production - pakeai CLI

Panduan lengkap untuk publish `pakeai` ke NPM Public Registry.

---

## ✅ Checklist Persiapan

### 1. File Config (`package.json`)

File: `packages/cli/package.json`

**Yang Perlu Dicek/Diupdate:**

```json
{
  "name": "pakeai",              // ✅ Harus unik di npmjs.org
  "version": "0.2.0",            // 🔧 Naikkan setiap kali publish (e.g., 0.2.0 → 0.3.0)
  "description": "CLI agent loop untuk AI coding agent...",
  "main": "dist/index.js",       // ✅ Entry point compiled
  "type": "module",              // ✅ ES Module mode
  
  "bin": {                       // ✅ Binary command yang akan tersedia
    "pakeai": "./dist/index.js"
  },
  
  "scripts": {                   // ✅ Scripts publish siap
    "build": "tsc",
    "publish:latest": "npm run build && npm publish --access public",
    "publish:beta": "npm run build && npm publish --tag beta --access public"
  },
  
  "keywords": ["cli", "ai", "coding-agent"],  // ✅ Untuk discoverability
  "homepage": "https://github.com/rijalrf/pakeai#readme",  // ← Update URL repo
  "bugs": {                      // ← Contact info
    "url": "https://github.com/rijalrf/pakeai/issues",
    "email": "support@pakeai.dev"
  },
  "license": "MIT",              // ✅ Open source license
  "author": "Your Name <your@email.com>",  // ← GANTI DENGAN DATA ANDA!
  "engines": {                   // ✅ Minimum Node version
    "node": ">=18.0.0"
  },
  "repository": {                // ← Update dengan repository GitHub Anda!
    "type": "git",
    "url": "https://github.com/rijalrf/pakeai.git"
  }
}
```

**Action Item:**
- [ ] Naikkan `version` dari `0.2.0` → `0.3.0`
- [ ] Update `author` dengan nama dan email Anda
- [ ] Update `repository.url` ke repository GitHub Anda
- [ ] Update `bugs.email` dan `bugs.url` jika perlu

---

### 2. Dokumentasi (`README.md`)

File: `packages/cli/README.md`

**Pastikan mencakup:**
- [x] Installasi instruction (`npx pakeai login <token>`)
- [x] Semua available commands (`login`, `switch`, `whoami`, `next`, `start`, `context`, `done`, `brd`, `logout`, `status`)
- [x] Contoh penggunaan
- [x] Security notes (PAT hashing)
- [x] License information

**Yang perlu di-update:**
```markdown
## Support

- Repository: **[UPDATE URL REPO ANDA]**
- Issues: **[UPDATE URL ISSUES]**

## License

MIT © **[Nama Anda]**
```

---

### 3. Exclusion File (`.npmignore`)

File: `packages/cli/.npmignore` ✅ **SUDAH BENAR**

File ini sudah meng-exclude development files:
- `src/` → source TypeScript tidak ikut
- `*.ts` → TypeScript source hanya di dist
- `node_modules/` → dependencies external
- `.env` → secret tidak ikut
- Test files dan IDE configs

**Tidak perlu diubah!**

---

### 4. Compiled Output (`dist/`)

Setelah build, pastikan folder `dist/` berisi:
- ✅ `index.js` - Main CLI entry
- ✅ `api-client.js` - API client module
- ✅ `config.js` - Configuration loader
- ✅ `.d.ts` files (type definitions)

**Build dulu sebelum publish:**
```bash
pnpm run build
```

---

## 🚀 Step-by-Step Publish

### **STEP 1: Setup Akun NPM (Sekali seumur hidup!)**

```bash
# 1. Buka browser: https://www.npmjs.com
# 2. Klik "Sign Up" → daftar dengan email/GitHub
# 3. Verify email Anda
```

**Test apakah sudah login:**
```bash
npm whoami

# Jika error → belum login, lanjut ke STEP 2
```

---

### **STEP 2: Login ke NPM CLI**

```bash
cd /home/rijal/projects/ngodingpakeaiclone/packages/cli
npm login

# Akan muncul prompt interaktif:
# Username: [isi username npm Anda]
# Password: [isi password npm Anda]
# Email: [isi email yang sama]

# Command ini otomatis bikin file ~/.npmrc berisi auth token
```

**Verifikasi:**
```bash
cat ~/.npmrc
# Harus ada baris: //registry.npmjs.org/:_authToken=pak_...

whoami
# Output: [username-npm-anda]
```

---

### **STEP 3: Update Version**

```bash
vi packages/cli/package.json
# Ganti: "version": "0.2.0" → "version": "0.3.0"
```

**Or use sed:**
```bash
cd /home/rijal/projects/ngodingpakeaiclone
sed -i 's/"version": "0.2.0"/"version": "0.3.0"/' packages/cli/package.json
```

**Commit perubahan:**
```bash
git add packages/cli/package.json
git commit -m "chore: bump pakeai version to 0.3.0"
git push origin main
```

---

### **STEP 4: Build Package**

```bash
cd /home/rijal/projects/ngodingpakeaiclone/packages/cli

# Clean dan build
pnpm run build

# Verifikasi output
ls -la dist/
# Harusnya ada: index.js (9.3K), api-client.js, config.js
```

---

### **STEP 5: Dry Run Preview**

```bash
# Preview isi tarball tanpa upload
npm pack --dry-run

# Output preview apa saja yang akan di-upload
```

---

### **STEP 6: PUBLISH TO NPM!**

```bash
cd /home/rijal/projects/ngodingpakeaiclone/packages/cli

# Gunakan script yang sudah disetel:
pnpm run publish:latest

# Atau manual:
npm publish --access public

# Konfirmasi saat diminta:
# About to publish pakeai@0.3.0
# Do you want to publish? [y/N] y
```

---

### **STEP 7: Post-Publish Verification**

```bash
# Cek package live di registry:
curl -s https://registry.npmjs.org/pakeai | jq '.["dist-tags"].latest'
# Expected: "0.3.0"

# Test install dari npm:
npx pakeai@0.3.0 --help

# Atau install locally untuk test:
npm install -g pakeai@0.3.0
pakeai --help

# Uninstall global if needed:
npm uninstall -g pakeai
```

**Buka browser dan verify:**
- https://www.npmjs.com/package/pakeai
- Cek versi latest = 0.3.0
- Check README tampil benar

---

## 🔄 Update Berikutnya

Setiap kali mau publish update:

```bash
# 1. Commit changes & bump version
git add packages/cli/package.json
git commit -m "feat: add new feature X"
git push

# Edit package.json: "version": "0.3.0" → "0.3.1"

# 2. Rebuild & publish (auto-auth via ~/.npmrc)
cd packages/cli
pnpm run build
pnpm run publish:latest
```

**Versioning Convention:**
- `0.x.y` - Patch fixes (bug fixes only)
- `0.x.y` → `0.(x+1).0` - Minor features (new features, backward compatible)
- `0.x.z` → `(0+1).0.0` - Major breaking changes

---

## ⚠️ Troubleshooting

### Problem: "This package is already published"

```bash
# Error: E404 - Package not found or already published
# Solution: Version sudah ada, naikkan version number
vi packages/cli/package.json
# Change: "version": "0.3.0" → "0.3.1"
npm publish
```

### Problem: Authentication errors

```bash
# Clear NPM auth and re-login
rm ~/.npmrc
npm login

# Or edit manually
nano ~/.npmrc
# Regenerate token from npmjs.com dashboard if needed
```

### Problem: Network timeout

```bash
# Increase registry timeout
npm config set fetch-timeout 600000
npm publish

# Or try with verbose logging
npm publish --verbose
```

### Problem: Conflicting name on npm

```bash
# Check if name already exists
curl -s https://registry.npmjs.org/pakeai | jq '.name'

# If taken, rename package in package.json:
# {"name": "@rijalrf/pakeai", ...}

# And adjust bin path accordingly
```

---

## 📝 Pre-Publish Checklist

Before running `npm publish`:

- [ ] Version bumped in `package.json`
- [ ] All dependencies installed (`pnpm install`)
- [ ] Code builds successfully (`pnpm run build`)
- [ ] No sensitive data in source (`.npmignore` correct)
- [ ] README.md updated with latest info
- [ ] Author and repository URLs correct
- [ ] Tested locally (`npx pakeai@latest --help`)
- [ ] Git commit pushed to remote
- [ ] Logged in to npm (`npm whoami` shows username)

---

## 💡 Quick One-Liner

After verifying all pre-publish checklist items:

```bash
cd /home/rijal/projects/ngodingpakeaiclone/packages/cli && \
echo "✅ Ready to publish pakeai..." && \
pnpm run build && \
npm publish --access public && \
echo "🎉 Published successfully!"
```

---

## 🆘 Need Help?

**Resources:**
- NPM Registry Docs: https://docs.npmjs.com/
- Publishing Packages Guide: https://docs.npmjs.com/cli/v9/commands/npm-publish
- NPM Account Settings: https://www.npmjs.com/settings/{username}/tokens

**Support:**
- Issues: https://github.com/rijalrf/pakeai/issues
- Email: support@pakeai.dev

---

## 📋 Summary

| Task | Status | Notes |
|------|--------|-------|
| Setup NPM account | ☐ | Register at npmjs.com |
| Login to NPM CLI | ☐ | `npm login` (one-time) |
| Update author info | ☐ | In `package.json` |
| Update repo URL | ☐ | Ensure points to your GitHub |
| Bump version | ☐ | Change before each publish |
| Build package | ☐ | `pnpm run build` |
| Dry run test | ☐ | `npm pack --dry-run` |
| Publish to NPM | ☐ | `npm publish --access public` |
| Verify live | ☐ | Test with `npx pakeai@latest --help` |

**Total time: ~10 minutes** (one-time setup + automated publish process)

---

*Generated for pakeai CLI production deployment*
