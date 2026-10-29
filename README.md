# SceneIt

SceneIt is a social movie-ranking web application that helps users rank movies through head-to-head comparisons instead of traditional star or numerical ratings. Users can track movies they have watched, write reviews, connect with friends, and discover movies based on their personal preferences and their friends’ rankings.

## Goals and Features

SceneIt aims to make movie discovery more personalized, expressive, and social. Its main features include:

- **Head-to-Head Movie Rankings:** Compare movies to build a personalized ranking list, with options to tie or rerank movies.
- **Personalized Recommendations:** Discover movies based on individual rankings and viewing preferences.
- **Movie Blend:** Collaborate with up to five friends to find movies that match everyone's interests.
- **Reviews and Social Interaction:** Write movie reviews, explore friends’ rankings, and comment on their reviews.
- **Community Leaderboards:** View weekly and monthly rankings based on the SceneIt community.
- **Customizable Profiles:** Display favorite movies, bios, pronouns, achievements, and other profile details.
- **Community Safety:** Report inappropriate reviews and comments.

## Tech Stack

- **Frontend:** React
- **Backend and Database:** Supabase and PostgreSQL
- **Movie Data:** TMDb API
- **Deployment:** Vercel
- **Version Control:** Git and GitHub

## Repository Structure

The repository is organized around the frontend application, backend configuration, and project documentation.

```text
SceneIt/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions: tests and production build
│
├── public/                        # Static files served directly
│   ├── favicon.svg                # Browser tab icon
│   └── icons.svg                  # Reusable SVG icon library for the UI
│
├── src/
│   ├── assets/                    # Imported images, logos, and icons
│   ├── components/                # Reusable UI components
│   ├── features/                  # Feature-specific code
│   ├── pages/                     # Full application pages
│   ├── lib/                       # Shared utilities and API clients
│   ├── App.jsx                    # Main React application
│   ├── App.css                    # Application-specific styles
│   ├── index.css                  # Global styles
│   └── main.jsx                   # React entry point
│
├── tests/
│   ├── unit/                      # Unit tests
│   │   └── example.test.js
│   ├── integration/               # Integration tests (add when needed)
│   └── e2e/                       # End-to-end browser tests (add later)
│
├── supabase/                      # Database migrations and seed data
│
├── performance/
│   └── k6/                        # Load and performance tests (optional)
│
│
├── .gitignore                     # Files Git should ignore
├── .env.example                   # Template for required environment variables
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and npm scripts
├── package-lock.json              # Locked dependency versions
├── vite.config.js                 # Vite configuration
└── README.md                      # Project overview and setup instructions
```

### Directory Guidelines

- **`public/`**: Files that need a fixed URL or should be served without being imported into JavaScript.
- **`src/assets/`**: Static assets imported into React components or CSS.
- **`src/components/`**: Reusable interface elements, such as movie cards, buttons, and navigation bars.
- **`src/features/`**: Code organized around features, such as movie ranking, reviews, and user profiles.
- **`src/pages/`**: Full pages, such as the home page, movie details page, and user profile.
- **`src/lib/`**: Shared utilities, API clients, and configuration helpers.
- **`tests/unit/`**: Tests for individual functions or components.
- **`tests/integration/`**: Tests that verify multiple components or modules work together.
- **`tests/e2e/`**: Browser-based tests that verify complete user workflows.
- **`.github/workflows/`**: Automated GitHub Actions workflows for testing and other development tasks.
- **`supabase/`**: Database migrations and seed files when database development begins.
- **`performance/k6/`**: Optional scripts for testing application performance under load.

*Note: This is the planned structure. Some directories can be added when their corresponding features or tests are implemented.*


## Getting Started

Follow these steps to set up SceneIt locally and start contributing.

### Prerequisites

Make sure you have the following installed:

- [Git](https://git-scm.com/downloads) — for version control.
- [Node.js and npm](https://nodejs.org/) — for running the React + Vite application and managing dependencies.
- [GitHub CLI](https://cli.github.com/) (optional) — for creating and managing pull requests from the terminal. You can also create PRs through the GitHub website.
- A GitHub account with access to the SceneIt repository.

Verify that Git, Node.js, and npm are installed:

```bash
git --version
node -v
npm -v
```

If you plan to use GitHub CLI, verify its installation:

```bash
gh --version
```

## 1. Clone the Repository

Clone the SceneIt repository and navigate into the project directory:

```bash
git clone <REPOSITORY_URL>
cd SceneIt
```

Replace `<REPOSITORY_URL>` with the repository URL from GitHub.

## 2. Install Dependencies

Run the following command from the project root:

```bash
npm ci
```

This installs the project's dependencies using `package-lock.json`, including React, Vite, and Vitest.

Run this during initial setup or when dependencies change.

## 3. Configure Enviornment Variables

Create a `.env` file, and copy the `.env.example` contents over to `.env` and add the values to the keys.
It should look something like below the key-value pair below.

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Make sure that .env is not tracked in git status.

## 4. Verify Your Setup

Run the following commands from the project root:

```bash
npm run test:run
npm run build
npm run dev
```

These commands serve different purposes:

- **`npm run test:run`** — Runs the project's Vitest unit tests.
- **`npm run build`** — Checks whether the application can be built for production.
- **`npm run dev`** — Starts the local development server. Open the URL printed in the terminal, usually `http://localhost:5173`, to view and interact with SceneIt.

The development server is for local development and manual testing, not automated end-to-end testing. Automated browser tests can be added later using a tool such as Playwright.

If the tests and build succeed and the application runs locally, you're ready to start contributing.

## Demo Movie Data

The local demo runs on a fixed catalog in `src/data/movies.json` and stores the guest's list in localStorage (see `src/lib/localStore.js`). No TMDb calls happen at runtime.

To fill in real posters, add `TMDB_READ_TOKEN` to your `.env` and run:

```bash
npm run posters          # only movies without a poster yet
npm run posters -- --all # refresh every movie
```

Then commit the updated `movies.json`. Movies without a poster show a placeholder card.

## Development Workflow

### 1. Create a Feature Branch

Before working on a feature or task, make sure your local `main` branch is up to date:

```bash
git switch main
git pull origin main
git switch -c feature/YOUR_FEATURE_NAME
```

Replace `FEATURE_NAME` with a short description of your task. For example:

```bash
git switch -c feature/movie-search
```

Create a separate branch for each feature or task. Avoid committing directly to `main`.

### 2. Make Changes and Run Checks

Implement your changes, then run the tests and production build:

```bash
npm run test:run
npm run build
```

Fix any failures before pushing your changes.

### 3. Commit and Push Your Changes

Stage and commit your changes:

```bash
git add .
git commit -m "YOUR_COMMIT_MESSAGE"
git push -u origin feature/YOUR_FEATURE_NAME
```

Replace `COMMIT_MESSAGE` with a brief description, such as:

```bash
git commit -m "Implement movie search"
```
After commiting you changes, we do not need to push but instead create a Pull Request.

### 4. Create a Pull Request (PR)

**Pushing your branch does not automatically merge your changes into `main`.** You must open a pull request asking to merge your feature branch into `main`.

You can create a PR using either method below.

#### Option A: GitHub Website

1. Open the SceneIt repository on GitHub.
2. Click **Compare & pull request** if GitHub displays the option, or navigate to **Pull requests** and click **New pull request**.
3. Set the base branch to `main`.
4. Set the compare branch to your feature branch, such as `feature/movie-search`.
5. Add a descriptive title and explain your changes.
6. Include the tests you ran and any relevant notes.
7. Click **Create pull request**.

#### Option B: GitHub CLI

If you installed GitHub CLI, authenticate first:

```bash
gh auth login
```

Then create your PR from your feature branch:

```bash
gh pr create --base main --head feature/YOUR_FEATURE_NAME --title "YOUR_PR_TITLE" --body "YOUR_PR_DESCRIPTION"
```

You can also use the interactive prompt:

```bash
gh pr create --web
```

## GitHub Pull Request Shortcut (OPTIONAL but this will make pr a bit easier)

Set up a `pr` command to open GitHub's pull request creation page in your default browser.

### Prerequisites

- [Git](https://git-scm.com/downloads)
- [GitHub CLI](https://cli.github.com/)

Authenticate with GitHub:

```bash
gh auth login
```

### macOS (zsh or bash)

1. Open your shell configuration:

   ```bash
   nano ~/.zshrc
   OR
   nano ~/.bashrc
   ```

2. Add this alias:

   ```bash
   alias pr='gh pr create --web'
   alias rt='npm run test:run'
   alias rb='npm run build'
   ```
   Note: you dont have to add rt and rb, but it will make it easier since you won't need to type the entire cmd.

3. Reload your configuration:

   ```bash
   source ~/.zshrc
   OR
   source ~/.bashrc
   ```

### Windows (PowerShell)

1. Open your PowerShell profile:

   ```powershell
   if (!(Test-Path $PROFILE)) {
       New-Item -Path $PROFILE -ItemType File -Force
   }
   notepad $PROFILE
   ```

2. Add this function to the file:

   ```powershell
   function pr {
       gh pr create --web
   }
   ```

3. Reload your profile:

   ```powershell
   . $PROFILE
   ```

### Usage

From your repository, run:

```bash
pr
```

This opens the PR creation page in your browser.

### Example Workflow

```bash
git switch mainline
git pull
git switch -c setup

# Make changes
git add .
git commit -m "Set up project structure"
git push -u origin setup

# Open the PR creation page
pr
```

### Notes

- Each developer must configure the shortcut on their own computer.
- The command opens the PR creation page but does not submit it automatically.
- Verify that the base branch is `mainline` before submitting.

### 5. Review, Test, and Merge

Once the PR is opened:

1. **GitHub Actions runs CI checks.** The workflow runs the configured unit tests and production build.
2. **Teammates review the changes.** Address any requested changes by committing and pushing to the same feature branch. The existing PR updates automatically.
3. **Wait for the required approvals and checks.** The `main` branch rules require two approvals and successful required status checks once those checks have been configured.
4. **Resolve review conversations.** Address and resolve outstanding review comments.
5. **Merge the PR.** Once all branch protection requirements are satisfied, merge the changes into `main`.

After merging, update your local `main` before starting your next task:

```bash
git switch main
git pull origin main
```

Then create a new feature branch for your next task.

## Automated Testing and CI

SceneIt uses Vitest for unit testing and GitHub Actions for continuous integration (CI).

- **Vitest:** Tests individual functions and pieces of application logic.
- **GitHub Actions:** Automatically runs the configured tests and build checks when a PR targets `main` and when changes are pushed to `main`.
- **Production build:** Verifies that the application can be compiled for deployment.

Passing CI checks does not replace teammate review. Both the required checks and approvals must be satisfied before merging into `main`.

## Important Notes

- Do not commit directly to `main`; use feature branches and pull requests.
- Do not commit secrets or your local `.env` file. Keep local environment files excluded through `.gitignore`.
- If dependencies change, commit both `package.json` and `package-lock.json` so other teammates can install the same dependencies.
- If you encounter setup issues, check the terminal output and confirm that you're running commands from the SceneIt project root.
