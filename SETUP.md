# Setup guide

A step-by-step guide to running this project on your own computer, making changes, and putting it
online. Written assuming little to no coding background -- each step says what to type and what
it does.

## 1. Install the tools

You need two things installed once, before anything else:

- **Node.js** -- the program that runs this website's code on your computer. Go to
  [nodejs.org](https://nodejs.org), download the **LTS** version, and install it like any other
  program (click through the installer with the default options).
- **Git** -- used to download and save changes to the project's code. Go to
  [git-scm.com/downloads](https://git-scm.com/downloads), download it, and install it with the
  default options.

To check both installed correctly, open a terminal (on Windows: search for "PowerShell" in the
Start menu; on Mac: search for "Terminal") and type:

```bash
node --version
git --version
```

Each should print a version number (e.g. `v22.11.0`). If you get an error instead, the install
didn't complete -- try again, or restart your computer and check again.

## 2. Get the project's code

If you don't already have a copy of this project's folder, download it from wherever it's
hosted (ask whoever gave you this guide for the link if you're not sure), or if it's on GitHub:

```bash
git clone <the project's GitHub URL>
cd rise-underground
```

`cd rise-underground` moves your terminal "into" the project folder -- every command after this
should be run from inside it.

## 3. Install the project's dependencies

```bash
npm install
```

This downloads all the code libraries this project depends on (things like React and Next.js).
It only needs to be run once, or again later if you pull down changes that add something new. It
can take a minute or two -- that's normal.

## 4. Run it on your computer

```bash
npm run dev
```

This starts the website running on your own computer. Once it says something like
`Ready in ...ms`, open a web browser and go to:

```
http://localhost:3000
```

You should see the site. Leave the terminal window open while you're working -- closing it stops
the site. To stop it yourself, click into the terminal and press `Ctrl+C`.

**Making a change**: if you (or whoever's helping you) edit a file while `npm run dev` is
running, the page in your browser updates automatically within a second or two -- no need to
restart anything.

## 5. Check it's production-ready

Before putting changes online, it's worth confirming the site builds cleanly:

```bash
npm run build
```

This does a stricter check than `npm run dev` and will tell you clearly if something's broken. If
it finishes without errors, you're good to deploy.

**This build check alone doesn't prove the live data is working.** Every page reads its data live
from `rise-underground.github.io` (a separate, older site whose own pipeline keeps that data
current -- see `.claude/CODING-STANDARDS.md`'s Data fetching section). If that site ever goes down,
gets renamed, or moves its files, this build will still succeed -- every page fails gracefully
with an on-page error message instead of crashing, so a broken data source doesn't show up as a
build error. After building (or with `npm run dev`), actually open each page --
`/`, `/leaderboard`, `/poa-tracker`, `/rise-tracker`, `/almanac` -- and confirm you see real numbers
and content, not a message like "Could not load ... data". If you do see that message on a page,
the old site is unreachable or has changed, and the deploy will go out with that page broken until
it's fixed.

## 6. Put it online (deploy)

This project deploys to **Vercel** (a free hosting service made by the same people behind
Next.js, the framework this site is built with). One-time setup:

1. Push this project to GitHub if it isn't already there. If this folder came from a zip file
   rather than `git clone`, it won't have version history yet -- start that first:
   ```bash
   git init
   git add -A
   git commit -m "Initial commit"
   ```
   Then push it:
   ```bash
   git remote add origin <your GitHub repo URL>
   git push -u origin main
   ```
   (If you don't have a GitHub repo yet, create an empty one at [github.com/new](https://github.com/new) first, then use the URL it gives you.)
2. Go to [vercel.com](https://vercel.com) and sign up/log in (using your GitHub account is
   easiest).
3. Click **Add New -> Project**, choose this repo from the list, and click **Deploy**. Vercel
   detects it's a Next.js project automatically -- you shouldn't need to change any settings.
4. After a minute or two, Vercel gives you a live URL (something like
   `rise-underground.vercel.app`). That's the site, online, for anyone to visit.
5. In the Vercel project's **Settings -> Environment Variables**, add `NEXT_PUBLIC_SITE_URL` set to
   that live URL (e.g. `https://rise-underground.vercel.app`, or your custom domain if you set one
   up), then redeploy. This isn't required for the site to work -- it's only used to make sure
   social-media link previews and search engines see the right URL.

From then on, every time you `git push` a change to the `main` branch, Vercel automatically
rebuilds and updates the live site within a minute or two -- no need to repeat these steps.

## If something goes wrong

- **`npm run dev` or `npm run build` fails with a wall of `Watchpack Error` messages, or an error
  mentioning `CLAUDE.md` and "outside of root directory"**: this happens specifically when the
  project's files live on a network-mounted drive that isn't your computer's real hard drive (for
  example, a drive backed by WSL on Windows). If that's your setup, run the same commands from
  inside WSL directly (search "WSL" or "Ubuntu" in your Start menu to open it), using the project's
  path there rather than the Windows drive letter.
- **Anything else**: copy the exact error message and bring it to whoever is helping you maintain
  this project (or a Claude Code session pointed at this repo) -- the full error text is almost
  always enough to diagnose what went wrong.
