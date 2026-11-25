This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## /hobby

The hobby pages are public and static. Tom edits them on the site after signing in at `/hobby/login`, which nothing links to. Each save is one commit to a private GitHub repo, so the repo's history is the edit log, and `git revert` undoes a bad edit.

Set these in the Vercel env (or `.env.local` for development):

| Variable | Value |
| --- | --- |
| `HOBBY_ADMIN_PASSWORD_HASH` | From `node scripts/hobby-password.mjs "your password"` |
| `HOBBY_SESSION_SECRET` | Printed by the same script |
| `HOBBY_GITHUB_REPO` | `owner/name` of the private data repo (a pasted repo URL also works) |
| `HOBBY_GITHUB_TOKEN` | A fine-grained token for that repo only, with Contents set to read and write |
| `HOBBY_GITHUB_BRANCH` | Optional; defaults to the repo's default branch |

In the data repo, protect the branch so force pushes and deletion are blocked; that keeps the history append-only. A Vercel Firewall rate-limit rule on `/hobby` backs up the app's own per-instance limits.

Without the GitHub variables, development saves to `.hobby-data/` (gitignored), with a plain `history.log` beside the files. On Vercel without them, the tabs show empty and saving is refused.
