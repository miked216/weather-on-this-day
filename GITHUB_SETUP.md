# How to Push to GitHub

You have a local git repository now. To put it on GitHub, follow these steps:

1.  **Create a Repository on GitHub**
    *   Go to [github.com/new](https://github.com/new).
    *   Name it `weather-history` (or whatever you like).
    *   **Do not** check "Initialize with README", "Add .gitignore", or "Choose a license" (since you already have code).
    *   Click **Create repository**.

2.  **Link and Push**
    *   Copy the commands under "…or push an existing repository from the command line". They will look like this:
        ```bash
        git remote add origin https://github.com/YOUR_USERNAME/weather-history.git
        git branch -M main
        git push -u origin main
        ```
    *   Paste those commands into your terminal here.

## Common Issues
*   **Authentication**: If asked for a password, you might need to use a [Personal Access Token](https://github.com/settings/tokens) if you don't have SSH keys set up.
*   **"Remote origin already exists"**: If you see this, run `git remote remove origin` and try again.
