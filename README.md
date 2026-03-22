This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

## 快速上手（必做）

1) 安装依赖：`npm install`

2) 准备环境变量：

```bash
cp .env.example .env
```

3) 编辑 `.env`，至少填好：`AUTH_SECRET`、`ADMIN_USERNAME`、`ADMIN_PASSWORD_HASH`。
	 - 生成 `AUTH_SECRET`：`openssl rand -base64 32`
	 - 生成密码 hash：
		 `node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync(process.argv[1], 10))" "你的密码"`
	 - ⚠️ `ADMIN_PASSWORD_HASH` 通常包含 `$`（例如以 `$2b$...` 开头）。Next 会对 `.env` 做变量展开，
		 所以需要把每个 `$` 写成 `\$` 进行转义，例如：
		 `ADMIN_PASSWORD_HASH="\$2b\$10\$..."`
	 - `OPENAI_API_KEY`（想用 AI 面板就填），`BLOB_READ_WRITE_TOKEN`（想上传图片就填）

4) 初始化数据库：`npx prisma migrate dev`

5) 启动：`npm run dev`，访问 `http://localhost:3000/login`

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database (Prisma + SQLite)

This project uses Prisma with a local SQLite database.

1) Create your env file:

```bash
cp .env.example .env
```

Then fill these variables in `.env`:

- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `OPENAI_API_KEY`
- `BLOB_READ_WRITE_TOKEN` (for image upload)

Generate a bcrypt hash for your admin password:

```bash
node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync(process.argv[1], 10))" "your-password"
```

2) Initialize / migrate the database schema:

```bash
npx prisma migrate dev
```

3) (Optional) Regenerate Prisma Client:

```bash
npx prisma generate
```

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000/login`.

## Deploy notes (Vercel)

- Image upload uses **Vercel Blob**. Set `BLOB_READ_WRITE_TOKEN` in Vercel Project Settings.
- The current database is a **local SQLite file** (`dev.db`) which is fine for local development.
	Vercel deployments are typically stateless, so you should switch to a hosted database for production (for example Turso/libSQL or Vercel Postgres) and adjust the Prisma adapter accordingly.

You can start editing the page by modifying `src/app/(authed)/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
