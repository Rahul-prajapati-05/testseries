# Deploying ParikshaPro on Render

This guide provides instructions to deploy your Vite + React Test Series application on **[Render.com](https://render.com)** as a **Free Static Site**.

---

## 🚀 Quick Steps

### Step 1: Push code to your GitHub Repository

If you haven't created a GitHub repository yet:
1. Go to [github.com/new](https://github.com/new) and create a new repository (e.g. `testseries`).
2. Run the following commands in your project terminal:

```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy on Render

1. Open [dashboard.render.com](https://dashboard.render.com) and log in (or sign up with GitHub).
2. Click the **"New +"** button at the top right and select **"Static Site"**.
3. Choose your repository from the list and click **"Connect"**.
4. Configure the build settings (already defined in `render.yaml`):

| Setting | Value |
| :--- | :--- |
| **Name** | `parikshapro-testseries` (or your custom name) |
| **Branch** | `main` |
| **Root Directory** | *(Leave blank)* |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

5. **Single Page Application (SPA) Rewrite Rule**:
   - Scroll down to the **"Redirects/Rewrites"** section.
   - Click **"Add Rule"**:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`
   *(This ensures proper routing when refreshing pages or navigating directly).*

6. Click **"Create Static Site"**.

---

### Step 3: Access your Live Website

Render will automatically run `npm install && npm run build`, bundle your application, and give you a free HTTPS URL:
`https://<your-app-name>.onrender.com`
