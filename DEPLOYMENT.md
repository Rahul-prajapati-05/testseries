# Deploying ParikshaPro on Render (Web Service vs Static Site)

This guide explains how to deploy your Test Series application so that **all manually added tests appear across all browsers and devices**.

---

## 🎯 Important: Web Service vs. Static Site

| Deployment Type | Backend `/api/tests` | Cross-Browser Auto-Sync | How to Share Tests |
| :--- | :--- | :--- | :--- |
| **Render Web Service (Recommended)** | ✅ Node.js Server (`server.js`) | ✅ **Automatic** (Any test created by admin syncs to all students in real time) | Share normal URL: `https://your-app.onrender.com` |
| **Render Static Site (Free)** | ❌ No Node server | ⚠️ Tests saved in browser LocalStorage | Use **"Share Website"** button or WhatsApp share link |

---

## 🚀 Option 1: Deploy as a Web Service (Recommended for Auto Cloud Sync)

Deploying as a **Web Service** runs `node server.js`, which serves both your React frontend and the `/api/tests` backend database.

### Step 1: Push latest changes to GitHub
In your project terminal, run:
```bash
git add .
git commit -m "Update tests and enable full test series synchronization"
git push origin master
```

### Step 2: Create Web Service on Render
1. Open **[dashboard.render.com](https://dashboard.render.com)**.
2. Click **"New +"** (top-right) and select **"Web Service"** *(Do NOT select Static Site)*.
3. Select your repository `testseries` and click **"Connect"**.
4. Configure the settings:
   - **Name**: `parikshapro-testseries` (or custom name)
   - **Region**: Choose closest to you (e.g. Singapore or Frankfurt)
   - **Branch**: `master` (or `main`)
   - **Root Directory**: *(Leave blank)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **"Create Web Service"**.

Render will build the app and start the live server. When you or any admin adds a test, it will automatically save and show up on every student's browser!

---

## 🌐 Option 2: Deploy as a Free Static Site (Using Direct Share Links)

If you already deployed as a **Static Site** on Render:

1. **How to share tests with students on Static Hosting**:
   - In the header, click the **"Share Website"** button (or click **"Share"** on any test card).
   - Click **"Copy Link"** or **"Share Directly on WhatsApp"**.
   - Send this link to students or open it in any other browser/phone.
   - The link carries the test data securely. When opened, all tests are automatically imported into that browser's catalog immediately!
2. **Permanent Default Tests**:
   - Tests committed in `src/data/mockData.js` and `data/tests.json` (such as the SSC test) are permanently built into the static site and visible to every visitor by default.
