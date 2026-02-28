# 📤 How to Upload to GitHub - Step by Step

## Method 1: GitHub Web Interface (Easiest - No Command Line)

### Step 1: Create GitHub Account
1. Go to https://github.com
2. Click "Sign up"
3. Follow the registration process

### Step 2: Create New Repository
1. Click the **+** icon in top right
2. Select **"New repository"**
3. Fill in:
   - **Repository name:** `cyber-essentials-checker`
   - **Description:** "AI-powered Cyber Essentials readiness assessment tool"
   - **Public** (so it works with GitHub Pages)
   - ✅ Check "Add a README file" (then we'll replace it)
4. Click **"Create repository"**

### Step 3: Upload Files
1. In your new repository, click **"Add file"** → **"Upload files"**
2. Drag and drop ALL files from the `cyber-essentials-checker` folder:
   - `index.html`
   - `README.md`
   - `LICENSE`
   - `.gitignore`
   - `docs/` folder (entire folder)
3. Add commit message: "Initial commit - Cyber Essentials Checker v1.0"
4. Click **"Commit changes"**

### Step 4: Enable GitHub Pages
1. Go to **Settings** (top menu)
2. Scroll to **Pages** (left sidebar)
3. Under **Source**, select:
   - Branch: **main**
   - Folder: **/ (root)**
4. Click **Save**
5. Wait 1-2 minutes
6. Visit: `https://cyber-essentials-checker.web.app/`

🎉 **Done! Your tool is now live!**

---

## Method 2: Using Git Command Line (For Developers)

### Prerequisites
```bash
# Install Git if you haven't
# macOS: brew install git
# Windows: Download from git-scm.com
# Linux: sudo apt-get install git

# Configure Git (first time only)
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### Step 1: Create Repository on GitHub
1. Go to https://github.com/new
2. Repository name: `cyber-essentials-checker`
3. Description: "AI-powered Cyber Essentials readiness assessment tool"
4. Public repository
5. **DON'T** initialize with README (we have our own)
6. Click "Create repository"

### Step 2: Upload Your Code
```bash
# Navigate to the project folder
cd /path/to/cyber-essentials-checker

# Initialize Git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Cyber Essentials Checker v1.0"

# Add remote (replace with YOUR GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/cyber-essentials-checker.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages
```bash
# Via GitHub website
# Settings → Pages → Source: main branch → Save

# Or use GitHub CLI
gh repo edit --enable-pages --pages-branch main
```

### Step 4: Verify
```bash
# Your site will be at:
https://cyber-essentials-checker.web.app/
```

---

## Method 3: GitHub Desktop (Visual Interface)

### Step 1: Download GitHub Desktop
- Download from: https://desktop.github.com
- Install and sign in with your GitHub account

### Step 2: Create Repository
1. **File** → **New Repository**
2. Name: `cyber-essentials-checker`
3. Local Path: Choose where to save
4. Click **Create Repository**

### Step 3: Copy Files
1. Copy all files from your `cyber-essentials-checker` folder
2. Paste into the repository folder GitHub Desktop created
3. GitHub Desktop will show all new files

### Step 4: Commit and Push
1. Add commit message: "Initial commit - Cyber Essentials Checker v1.0"
2. Click **Commit to main**
3. Click **Publish repository**
4. Choose **Public**
5. Click **Publish Repository**

### Step 5: Enable GitHub Pages
1. Go to your repository on GitHub.com
2. Settings → Pages → Source: main branch → Save

---

## Troubleshooting

### "Repository already exists"
- Choose a different name
- Or delete the existing repository and try again

### "Permission denied"
- Make sure you're logged into GitHub
- Check your username in the URL

### "Files not uploading"
- Make sure files aren't too large (GitHub has 100MB limit)
- Check your internet connection

### "GitHub Pages not working"
- Wait 2-5 minutes after enabling Pages
- Make sure file is named `index.html` (not `cyber_essentials_checker.html`)
- Check repository is Public, not Private

### "404 Error on GitHub Pages"
- Verify the branch is set to `main`
- Check the file path is `/` (root)
- Wait a few more minutes for deployment

---

## After Upload - Next Steps

### 1. Update README with Your Info
Edit `README.md` and replace:
- `yourusername` → Your actual GitHub username
- `your-email@example.com` → Your email
- Add screenshots (optional)

### 2. Update License
Edit `LICENSE` and replace:
- `[Your Name]` → Your actual name

### 3. Share Your Tool
```
🎉 My Cyber Essentials Checker is live!
👉 https://cyber-essentials-checker.web.app/

Help small businesses achieve Cyber Essentials certification!
```

### 4. Make Updates
```bash
# After making changes to files
git add .
git commit -m "Description of changes"
git push

# GitHub Pages will automatically update in 1-2 minutes
```

---

## File Structure Checklist

Make sure you have all these files:

```
✅ index.html
✅ README.md
✅ LICENSE
✅ .gitignore
✅ docs/QUICK_START.md
✅ docs/DEPLOYMENT_GUIDE.md
✅ docs/EDITING_QUESTIONS_GUIDE.md
✅ docs/NEW_QUESTIONS_SUMMARY.md
✅ docs/add_save_feature.js
```

---

## Common Git Commands Reference

```bash
# Check status
git status

# See what changed
git diff

# Add specific file
git add filename.html

# Add all files
git add .

# Commit changes
git commit -m "Your message here"

# Push to GitHub
git push

# Pull latest changes
git pull

# Create new branch
git checkout -b new-feature

# Switch branches
git checkout main

# See commit history
git log
```

---

## Need Help?

- **GitHub Docs:** https://docs.github.com
- **GitHub Pages Guide:** https://pages.github.com
- **Git Tutorial:** https://git-scm.com/docs/gittutorial

---

## Alternative: Download as ZIP

If you prefer not to use Git:

1. Click **"Code"** button on your GitHub repository
2. Select **"Download ZIP"**
3. Extract and share the files
4. Users can open `index.html` directly

No GitHub Pages needed, but no automatic hosting either.

---

## Video Tutorials (Recommended)

Search YouTube for:
- "How to upload to GitHub for beginners"
- "How to use GitHub Pages"
- "GitHub Desktop tutorial"

---

**Questions?** Open an issue on the repository or check GitHub's documentation!

Good luck! 🚀
