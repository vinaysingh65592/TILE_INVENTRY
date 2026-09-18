# Vercel Deployment Guide 🚀

The project is fully prepared for zero-configuration deployment on **Vercel**.

---

## 🛠️ Vercel Build Scripts Configured

The repository includes pre-configured Vercel build scripts in `package.json` and `vercel.json`:
- `"postinstall": "prisma generate"`
- `"vercel-build": "prisma generate && prisma db push && prisma db seed && next build"`

---

## 🚀 Option 1: Deploy via Vercel CLI (Fastest)

Run the following command in your terminal from the project folder:

```bash
npx vercel
```

Follow the interactive prompts:
1. **Set up and deploy?** Type `y` and press Enter.
2. **Which scope?** Select your Vercel account.
3. **Link to existing project?** Type `n`.
4. **Project name?** Press Enter (default `tile`).
5. **In which directory is your code located?** Press Enter (`./`).
6. **Want to modify build settings?** Type `n`.

To deploy directly to Production:
```bash
npx vercel --prod
```

---

## 🌐 Option 2: Deploy via GitHub / Vercel Dashboard

1. Push this project folder to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Tile Warehouse System"
   git remote add origin https://github.com/<your-username>/tile-warehouse.git
   git push -u origin main
   ```
2. Go to [https://vercel.com/new](https://vercel.com/new).
3. Import your `tile-warehouse` GitHub repository.
4. Click **Deploy**. Vercel will automatically run the build script and publish your site!

---

## 🗄️ Database Setup on Vercel (PostgreSQL / Supabase / Neon)

While local SQLite (`dev.db`) runs out of the box for testing, for a persistent cloud database on Vercel:
1. In your Vercel Project Dashboard, go to **Storage** -> **Create Database** -> select **Postgres** (or connect Supabase / Neon / PlanetScale).
2. Set the `DATABASE_URL` environment variable in Vercel settings:
   `DATABASE_URL="postgresql://user:password@ep-host.postgres.database.azure.com/dbname?sslmode=require"`
3. Redeploy your project. Prisma will automatically sync the schema and seed your initial warehouse sections!
