# How to Host Your Weather App

Since this is a static website (HTML, CSS, and JS only), hosting it is very easy and free. Here are the two simplest methods:

## Option 1: Netlify Drop (Simplest, No Account Initially Required)
1.  Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2.  Open your file explorer (Finder) on your computer.
3.  Navigate to the project folder:
    `/Users/mikedavis/.gemini/antigravity/scratch/weather-history`
4.  Drag and drop the **entire folder** onto the Netlify page.
5.  It will deploy instantly and give you a live URL (e.g., `https://fluffy-clouds-123456.netlify.app`).

## Option 2: GitHub Pages (Best for Long Term)
If you use GitHub, this is the standard way.
1.  Create a new repository on GitHub.
2.  Push your code to the repository.
3.  Go to **Settings** > **Pages**.
4.  Select the `main` branch as the source.
5.  Your site will be live at `https://yourusername.github.io/repo-name`.

## Option 3: Vercel (Fast & Professional)
1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` inside the project folder.
3.  Follow the prompts (just hit Enter).
