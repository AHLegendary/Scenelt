# 🎬 SceneIt

**SceneIt** is a social movie-ranking web app. Instead of giving movies a star or 1–10 rating, you rank them through **head-to-head comparisons**, then share your rankings, write reviews, and discover movies with friends.

---

## Table of Contents

- [Why SceneIt](#why-sceneit)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Use Cases](#use-cases)
- [Non-Functional Requirements](#non-functional-requirements)
- [Robustness](#robustness)
- [Testing](#testing)
- [Bug Tracking](#bug-tracking)
- [Schedule & Milestones](#schedule--milestones)
- [Risks](#risks)
- [Team](#team)
- [Documentation](#documentation)

---

## Why SceneIt

**The problem:** Platforms like Letterboxd and IMDb use 5-star or 1–10 scales. That's only ~10 possible scores, so two movies rated 4 stars (or 8/10) end up tied even when you clearly prefer one.

**Our approach:** SceneIt asks *"Which did you like more?"* By comparing a new movie against ones you've already ranked, it builds an ordered list that reflects your actual taste. The ranking then powers everything else: recommendations, leaderboards, and Movie Blend.

**Goal:** Give users a more expressive way to represent and share their movie taste, find common interests with friends, and make movie discovery more social.

---

## Features

### MVP

- **Head-to-head ranking**
  - Swipe toward the movie you prefer (dating-app style)
  - Mark ties and re-rank movies whenever your opinion changes
  - Numerical scores unlock after **10** ranked movies; personalized recommendations after **15**
- **Personalized recommendations** based on your rankings
- **Movie Blend:** group recommendations based on shared taste
  - Invite friends (max **5** members), leave anytime
  - Displayed as a widget
- **Community ratings** from SceneIt's own user data (separate from IMDb / Rotten Tomatoes)
- **Global leaderboards** (weekly & monthly): most-watched and highest-rated
- **Customizable profiles:** visibility (public/private), bio, pronouns, top 3 movies
- **Reviews & comments** on movies and friends' reviews
- **Reporting** for inappropriate reviews and comments

### Stretch Goals

Built only after all MVP features are complete.

- Extra profile customization: custom statuses (Discord/Steam style), achievements, and claimable rewards
- Tag friends you watched a movie with
- Bookmark upcoming movies, with a global ranking of the most-bookmarked releases
- Desktop implementation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (HTML, CSS, JavaScript), deployed on **Vercel** |
| Backend / Server API | **Vercel serverless functions** |
| Database | **Supabase** (PostgreSQL) with Row-Level Security |
| Auth | **Supabase Auth** (JWT, hashed passwords) |
| Movie data | **TMDb API** |
| CI / Source control | GitHub + GitHub Actions |
| Load testing | k6 |

---

## Project Structure

### Web client (`src/`)

| Path | Responsibility |
|---|---|
| `src/pages/` | Page-level screens: discovery, rankings, profiles, reviews, friends, Movie Blend |
| `src/components/` | Reusable UI: nav bars, movie cards, buttons, loaders, dialogs |
| `src/components/auth` | Sign-up, login, logout screens |
| `src/features/ranking/` | Head-to-head comparison UI, tie selection, ranked-list display |
| `src/features/profiles` | Profiles, bios, top movies, visibility settings |
| `src/features/reviews` | Writing/displaying reviews, comments, reporting |
| `src/features/friends` | Friend lists, incoming/outgoing requests |
| `src/features/blends` | Create/join blends, invites, group recs, leaving |
| `src/features/discovery` | Search, movie details, watchlist, personalized recs |
| `src/features/leaderboards` | Weekly/monthly most-watched and highest-rated lists |
| `src/lib` | Supabase client, API helpers, shared validation |

### Server API (`api/`)

| Path | Responsibility |
|---|---|
| `api/movies/` | Searches TMDb, retrieves details, caches movie data in the DB |
| `api/recommendations/` | Personal recs (15+ rankings) and Movie Blend recs |
| `api/blends/` | Invites, membership, 5-member limit, ownership transfer |
| `api/leaderboards/` | Weekly/monthly lists from aggregated DB data |
| `api/moderation/` | Length limits, blocklist checks, report processing |

All endpoints accept HTTPS requests and exchange JSON.

---

## Architecture

### Major components

- **Web Client** (React on Vercel): everything the user sees.
  - **Ranking Module:** runs head-to-head comparisons using binary insertion
  - **Score Display:** converts ranked positions into numerical scores (10+ movies)
  - **Data Layer:** centralizes all Supabase and API calls so UI components never make network requests directly
- **Authentication** (Supabase Auth): sign-up/login with email, username, and password; JWT sessions; hashed passwords
- **Database** (Supabase PostgreSQL):
  - RLS policies on every table
  - `save_ranking` function: inserts or re-ranks a movie and shifts other positions
  - Views for community rankings and leaderboards
- **Server API** (Vercel serverless): logic the client shouldn't run (secret keys, cross-user rules, moderation)
- **TMDb API:** source of titles, posters, and movie details

### Interfaces

| From → To | Mechanism | Used for |
|---|---|---|
| Client → Supabase Auth | `supabase-js` auth functions | Sign-up, login, logout (returns JWT) |
| Client → Database | `supabase-js` over HTTPS with JWT | Profiles, friends, watchlist, reviews, comments, rankings, `save_ranking` |
| Client → Server API | REST/JSON over HTTPS | Search, Movie Blend, recs, leaderboards, posting reviews/comments |
| Server API → Database | `supabase-js` server client | Reading user rankings |
| Server API → TMDb | REST over HTTPS | Movie search and details |

### Key workflows

- **Ranking a movie:** user compares two movies → ranking module finds the position → data layer calls `save_ranking` → UI updates list and score.
- **Searching:** client → movie service → TMDb → results cached in PostgreSQL → returned to client.
- **Writing a review:** client → moderation service validates → stored under RLS policies.
- **Movie Blend:** client → blend + recommendation services verify membership → recs generated from members' rankings.
- **Leaderboards:** client → leaderboard service → aggregated DB views.

### Architectural decisions

**1. Supabase + RLS + serverless instead of a dedicated backend server**

| Dedicated server pros | Dedicated server cons |
|---|---|
| Easier to debug and log in one place | We'd have to build and host it ourselves |
| No vendor reliance | Every simple read adds an extra network hop |
| Authorization lives in familiar app code | Free-tier hosting means cold starts / sleeping instances |

We chose Supabase so the team can focus on features instead of infrastructure.

**2. Web app instead of a native app**

| Native pros | Native cons |
|---|---|
| Smoother swipe interactions | Nobody on the team has mobile experience |
| Push notifications (blend invites, friend activity) | Testers must install before testing |
| App store visibility | Requires emulators/device testing |

A web app works in any browser with nothing to install, and Vercel lets us push updates instantly for demos and usability tests.

### Assumptions

- Users can pick a preferred movie; when they can't, a "can't choose" option counts as an implicit tie.
- TMDb's free tier is enough. Caching reduces API calls and doubles as a fallback when TMDb is down.
- We stay within Supabase's free tier (500 MB DB, 50,000 MAU, unlimited API calls, 1 GB storage).
- RLS is sufficient access control for data the client reads/writes directly. Anything needing cross-user access or secrets goes through the Server API.
- Ranked lists stay under ~500 movies, so binary insertion needs at most ~9 comparisons, all run in the browser with no network round trip.

---

## Database Schema

All tables have RLS enabled. Credentials and password hashes are stored by Supabase Auth, **not** in our tables.

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | `id` (PK, FK → auth user), `username` (unique), `bio`, `is_public`, `top_movies` (max 3), `top_movies_visible`, `title` | Public profiles visible to all; private ones visible to friends only |
| `movies` | `tmdb_id` (PK), `title`, `release_date`, `poster_url`, `genres`, `cached_at` | TMDb data cache |
| `rankings` | `user_id`, `movie_id`, `position`, `created_at`, `updated_at` | Changed via `save_ranking`; tied movies share a position |
| `watchlist` | `user_id`, `movie_id`, `added_at` | Movies a user wants to watch |
| `friendships` | `requester_id`, `addressee_id`, `status`, `created_at` | |
| `reviews` | `id` (PK), `user_id`, `movie_id`, `body`, `is_hidden`, `created_at` | |
| `comments` | `id` (PK), `review_id`, `user_id`, `body`, `is_hidden`, `created_at` | |
| `reports` | `id` (PK), `reporter_id`, `review_id`, `comment_id`, `reason`, `status`, `created_at` | Moderation queue |
| `blends` | `id` (PK), `owner_id`, `created_at` | Movie Blend groups |
| `blend_members` | `blend_id`, `user_id`, `status`, `joined_at` | Max 5 members per blend |
| `achievements` / `user_achievements` | `achievement_id`, `user_id`, `unlocked_at`, `claimed_at` | Stretch goal |

### Computed (not stored)

- **Numerical scores:** calculated from a movie's position and list size at display time, so they never go stale after re-ranking.
- **Community ratings & leaderboards:** database views that aggregate rankings across users.

---

## Use Cases

<details>
<summary><b>1. User Login</b></summary>

- **Actors:** User, SceneIt login system
- **Trigger:** User visits the web page
- **Preconditions:** Browser open, internet connection, existing account
- **Success flow:** Click "Log in" → enter username/password → system authenticates → redirect to home page with profile icon and full feature access
- **Variations:**
  - *Email login:* enter email → system sends code → enter code → verified → home page
  - *Phone login:* enter phone number → system texts code → enter code → verified → home page
- **Failures:** Invalid/mistyped email or phone (error + re-enter), invalid username or password (error explaining unmet conditions), early exit (back to home page)

</details>

<details>
<summary><b>2. Account Creation</b></summary>

- **Actors:** Unregistered user, SceneIt login system
- **Trigger:** User wants to create an account
- **Preconditions:** On the main page, internet connection
- **Success flow:** Select "Create an account" → create username and password → credentials verified → redirect to home page with all features unlocked
- **Variations:** Sign up with email or phone number, verified by a sent code
- **Failures:** Same as login (invalid/mistyped email or phone, invalid username/password, early exit)

</details>

<details>
<summary><b>3. Rank a Movie (Head-to-Head)</b></summary>

- **Actors:** Registered user, SceneIt ranking system
- **Trigger:** User adds a newly watched movie and wants to rank it
- **Preconditions:** Logged in, at least 1 movie already in their list, movie exists in SceneIt's database
- **Success flow:**
  1. Search for and select the movie
  2. SceneIt shows it against a movie from the user's list
  3. User swipes toward the preferred movie, or selects a tie
  4. SceneIt picks the next comparison based on the choice
  5. Repeat until the position is determined
  6. Ranking is saved
  7. At 10+ movies, numerical scores are shown; at 15+, personalized recommendations unlock
- **Variations:** Tie, re-ranking, fewer than 10 movies (show how many more are needed), movie already ranked (offer to re-rank)
- **Failures:** Movie not found, database error (prompt retry), user exits early (ranking not finalized, can restart)

</details>

<details>
<summary><b>4. Write a Review & Interact with Friends</b></summary>

- **Actors:** Registered user
- **Trigger:** User opens a movie or a friend's review
- **Preconditions:** Logged in, movie/review available
- **Success flow:** Write a review or comment → SceneIt validates and saves → displays it per visibility settings
- **Variations:** Edit own review, delete own comment
- **Failures:** Invalid submission (error, ask to correct), database error (retry)

</details>

<details>
<summary><b>5. Movie Blend</b></summary>

- **Actors:** Registered user, recommendation system, user's friends
- **Trigger:** User wants to find movies they and their friends would enjoy
- **Preconditions:** Logged in, 15+ ranked movies, at least one friend
- **Success flow:** Open Movie Blend widget → create blend → invite friends → friends accept/decline → accepted friends added (up to 5 total) → SceneIt combines members' rankings → widget shows recommendations → members browse details → members can leave anytime
- **Variations:** Invite more friends (if under 5), invite declined, blend at capacity, insufficient ranking data (suggest ranking more), creator leaves (ownership goes to the oldest remaining member)
- **Failures:** Invite fails to send, invalid/expired invite, network error, database error, blend no longer exists (return to widget)

</details>

<details>
<summary><b>6. Discover Recommended Movies</b></summary>

- **Actors:** Registered user, recommendation system
- **Trigger:** User opens the recommendations section
- **Preconditions:** Logged in, some movies ranked, TMDb (and optionally Rotten Tomatoes) data available
- **Success flow:** SceneIt pulls rankings and history → generates recs → shows Netflix-style lists with posters and titles → user browses, views details, adds to watchlist or marks as watched
- **Variations:** Categorized lists ("Because You Ranked These Highly", "Movies You Might Like"), movie already watched (view or update ranking), infinite scroll, fewer than 15 rankings (prompt to rank more)
- **Failures:** TMDb unavailable, database error, no recommendations (suggest manual search), network error

</details>

<details>
<summary><b>7. Achievements & Rewards</b> <i>(stretch)</i></summary>

- **Actors:** Registered user, achievement and reward system
- **Trigger:** User meets an achievement's requirements
- **Success flow:** Achievement pop-up → open achievements window (newest unclaimed at top) → click to claim reward
- **Variations:** User ignores the pop-up and doesn't visit the achievements page
- **Failures:** Network error (can't claim), database error (achievement doesn't display)

</details>

<details>
<summary><b>8. Customize Profile</b></summary>

- **Actors:** Registered user, profile system
- **Trigger:** User wants to personalize their profile
- **Success flow:** Open profile → edit → set bio, pronouns, public/private (default public), up to 3 favorite movies and their visibility → see earned titles → save → updated profile shown
- **Variations:** Leave bio/pronouns blank, pick fewer than 3 movies, hide top 3, earn a new title, cancel without saving
- **Failures:** Database error, invalid info (highlighted for correction), movie unavailable, network error

</details>

<details>
<summary><b>9. Global Leaderboards</b></summary>

- **Actors:** Registered user, leaderboard system
- **Trigger:** User opens the leaderboard section
- **Success flow:** Choose weekly or monthly → SceneIt retrieves data → shows ranked movies
- **Variations:** Switch time period, switch between most-watched and highest-ranked
- **Failures:** Data unavailable (retry), database error

</details>

<details>
<summary><b>10. Report Inappropriate Content</b></summary>

- **Actors:** Registered user, reporting system
- **Trigger:** User finds an inappropriate review or comment
- **Success flow:** Select "Report" → give a reason → report saved for moderation → confirmation shown
- **Variations:** Already reported (if duplicate prevention is supported), user cancels
- **Failures:** Submission failure (retry), missing/invalid reason

</details>

---

## Non-Functional Requirements

### Usability / Performance

| Requirement | Verification |
|---|---|
| Movie search results appear within **2 s** for 95% of queries; next comparison appears within **500 ms** of a choice. Must hold with 5 concurrent users, each with 20 ranked movies. | Time 30 searches in Chrome DevTools across browsers. Use **k6** to simulate 5 users ranking against 20-movie lists and check p95 response times. |
| Inserting into a list of *n* movies takes at most **⌈log₂(n+1)⌉** comparisons, the final position is consistent with every choice, and behavior is the same for small (0–15) and large (50–100+) lists. | Unit tests for list sizes 0, 1, 10, 25, 50, 100, 500, checking the comparison bound and that replaying recorded choices gives the same position. |
| New users can create an account, find a movie, and rank at least 3 movies with no instructions. | 5 outside testers, timed. Passes if at least 4 succeed. |

### Security & Privacy

| Requirement | Verification |
|---|---|
| Users can only edit/delete their own rankings and reviews. Profiles are visible to everyone if public, friends only if private. All traffic uses HTTPS; passwords are never stored in plain text. | Three dummy accounts: **A** (private), **B** (A's friend), **C** (not a friend). Confirm C can't view A and B can't modify A's data, via both UI and API/DB requests. Confirm RLS + a policy on every table, HTTP → HTTPS redirect, and hashed credentials via Supabase Auth. |

### Compatibility

| Requirement | Verification |
|---|---|
| All core features work on the latest Chrome and Safari and on phone-sized screens (**375 px**). | Manually run every core use case in each browser and in Chrome's device emulator at 375 px. Passes if completable with no layout blocks or errors. |

---

## Robustness

SceneIt should **fail gracefully**: no crashes, no lost data, no raw error output.

- **Invalid input:** Sign-up/login reject malformed emails, weak/empty passwords, and duplicate accounts with a clear pop-up. Reviews/comments reject empty text, over-length text, and blocklisted terms.
- **TMDb down or rate-limited:** Show a message like *"Couldn't load movies, try again later."* TMDb-dependent features (search, banners, leaderboards) become unavailable; everything else keeps working.
- **Supabase failure during ranking:** User is told the save failed and can retry.
- **Connection lost mid-ranking:** The existing list stays unchanged.

---

## Testing

- **Unit tests** (JavaScript): ranking module, score calculations, moderation checks
- **Integration tests:** run against a **separate Supabase test project** to cover `save_ranking`, RLS policies, and TMDb caching
- **Manual checks:** every page in Chrome DevTools, including offline mode to trigger error states; walk through every use case
- **Requirement tests:** ranking bound (0–500 movies), 30 timed searches, k6 load test, 3-account privacy test, RLS audit, HTTPS redirect, Chrome/Safari/375 px
- **Edge cases:** 10/15-movie unlock thresholds, 5-member blend limit, TMDb unavailable, ties in every position, re-ranking tied movies, two ranking tabs open at once, Supabase failure mid-save
- **Security:** read/write other users' rows, send requests with no token, search the JS bundle and network tab for leaked keys
- **Usability testing:**
  - *Round 1:* 2–3 prototypes tested by outsiders to see if head-to-head ranking is clear and fun
  - *Round 2 (~week 8):* 5 testers on the live Vercel app, recording completion, time, and confusion points

Each role (backend, frontend, design) owns the tests for its own area.

### Exit criteria

We ship when:

- All automated tests pass
- No open Critical or High bugs
- Core use cases work on Chrome and Safari at desktop and mobile widths
- Privacy checks pass
- At least 4 of 5 outside users complete the new-user tasks

---

## Bug Tracking

Bugs live in **GitHub Issues** with: steps to reproduce, expected vs. actual result, browser, and related test case.

| Severity | Examples | Policy |
|---|---|---|
| **Critical** | Data loss, privacy breach | Blocks merges |
| **High** | Broken core feature | Fixed that week |
| **Medium / Low** | Everything else | Fixed by next milestone |

Every fix is reviewed and gets a regression test. Open bugs are reviewed at the weekly meeting.

---

## Schedule & Milestones

Development is incremental: prototype first, then build and test small pieces. No task exceeds one person-week (PW).

### Milestone 1: Prototypes & Setup *(Internal, Oct 21–27)*

| Task | Effort | Depends on | Owner |
|---|---|---|---|
| Prototype 1: homepage, navigation, search, movie cards | 0.25 PW | Requirements, wireframes | Timothy |
| Prototype 2: head-to-head comparisons, ranked display, ties | 0.5 PW | Ranking use cases, wireframes | Timothy |
| Usability test both prototypes with outsiders | 0.5 PW | Both prototypes | Peter |
| Revise prototypes from feedback | 0.5 PW | Usability feedback | Timothy |
| Set up React app, GitHub repo, homepage | 0.25 PW | — | Arni |
| Set up Supabase DB (users, movies, rankings, watchlists) | 0.75 PW | DB design | Angel |
| Set up Vercel serverless functions + initial TMDb integration | 0.5 PW | DB & project setup | Riel |
| Configure JS testing + GitHub Actions CI | 0.5 PW | Repo & React setup | Leon |
| Document testing approach | 0.25 PW | Testing infra | Peter |

### Milestone 2: Core Functionality & Beta *(External, Nov 3)*

| Task | Effort | Depends on | Owner |
|---|---|---|---|
| Account creation, login, logout (Supabase Auth) | 0.5 PW | Supabase setup | Angel |
| Save/retrieve rankings | 0.5 PW | Schema, auth | Angel |
| TMDb search, details, caching | 0.75 PW | TMDb integration, DB | Riel |
| Login/signup pages with validation | 0.5 PW | Auth, approved designs | Leon |
| Search UI with movie cards and add-movie | 0.5 PW | TMDb API, search prototype | Arni |
| Binary insertion ranking + comparison screens | 0.5 PW | Ranking prototype, React | Arni |
| Automated tests for ranking and accounts | 0.5 PW | Ranking, auth | Peter |
| End-to-end test: signup → search → rank → save | 0.25 PW | Integrated FE + BE | Peter |
| Beta demo prep + README build/test/run instructions | 0.25 PW | Working beta | Riel |

### Milestone 3: Features & User Testing *(Internal/External, Nov 4–24)*

| Task | Effort | Depends on | Owner |
|---|---|---|---|
| Ties, re-ranking controls, scores after 10 rankings | 0.75 PW | Ranking algorithm & UI | Arni |
| DB functions for ties and re-ranking | 0.5 PW | Ranking DB ops | Angel |
| Personalized recommendations (15+ rankings) | 0.75 PW | Ranking persistence, TMDb | Riel |
| Recommendation UI with locked-feature indicators | 0.75 PW | Auth, DB setup | Leon |
| Design profile, review, friends, Movie Blend screens | 0.75 PW | Profile designs, DB ops | Timothy |
| DB ops + privacy policies for profiles, friends, reviews, comments | 0.5 PW | Review/comment DB ops | Riel |
| Review writing and comment viewing UI | 0.75 PW | Review service, social designs | Leon |
| Movie Blend invites, group recs, leaving | 0.5 PW | Ranking & friendship data | Riel |
| DB ops for blend membership + leaderboard views | 0.75 PW | Ranking & friendship data | Angel |
| Movie Blend UI | 0.5 PW | Blend service & designs | Leon |
| Community ratings + weekly/monthly leaderboard UI | 0.5 PW | Leaderboard views, movie data | Arni |
| Automated ranking, persistence, and privacy tests | 0.5 PW | Ranking & social components | Arni, Peter |
| Peer review + document feedback | 0.25 PW | Working app & docs | All |
| Usability testing with 5 outside users | 0.75 PW | Integrated features | Peter |

### Milestone 4: Final Testing & Release *(External, Nov 25 – Dec 11)*

| Task | Effort | Depends on | Owner |
|---|---|---|---|
| Test DB security, privacy, ranking persistence, access control | 0.5 PW | Backend complete | Angel |
| Fix DB/security issues | 0.25 PW | Security tests | Angel |
| Test TMDb error handling, search speed, ranking response times | 0.5 PW | API + ranking integration | Riel |
| Fix API, caching, recommendation issues | 0.25 PW | API test results | Riel |
| Fix frontend bugs; verify mobile/desktop responsiveness | 0.5 PW | Integration tests, feedback | Arni |
| Fix profile, review, blend, recommendation UI issues | 0.5 PW | Usability feedback, tests | Leon |
| Final UI/UX improvements | 0.5 PW | User testing feedback | Timothy |
| Test major use cases across viewports in Chrome & Safari | 0.5 PW | Final fixes | Peter |
| Finalize Vercel deploy, README, user & dev docs | 0.25 PW | Implementation & testing | All |
| Prepare final presentation and group reflection | 0.25 PW | Final release | All |

---

## Risks

| Risk | Likelihood | Impact | Prevention | Mitigation |
|---|---|---|---|---|
| **Outside commitments** (part-time jobs, other classes) | High | High | Plan meetings ahead, share schedule conflicts, set weekly responsibilities | Redistribute work when someone is unavailable |
| **Scope creep** (many interdependent features) | Medium | High | Map features and their dependencies; build quick versions and unit test early | Get the feature chain working before polishing any one feature |
| **Security & content moderation** (missing RLS policy or leaked key exposes data; harassment, spam, fake accounts) | High | High | RLS + policy on every table; keys only in server env vars; blocklist, length limits, report button | Make affected profiles private until fixed; rotate leaked keys in Vercel; hide content via `is_hidden`, remove accounts, update blocklist |
| **Ranking algorithm** (ties and re-ranking add edge cases; bad `save_ranking` corrupts lists, recs, and leaderboards) | Medium | High | Build ranking logic first, separate from UI/DB; design tie/re-rank logic before coding; Angel and Riel both review `save_ranking` | Fall back to plain binary insertion without ties, with re-rank as remove + insert; add ties back once stable |
| **Not enough user data** for recs, Blend, and leaderboards (worst case ~7 users) | Low–Medium | High | Recruit friends/family to rank 15+ movies; seed with TMDb data; create realistic test accounts | Use TMDb data as fallback; show "Rank X more movies to unlock Y"; use test accounts for demos |

**Detection:** weekly check-ins on availability; early unit tests; privacy tests after any change to profiles, friendships, or RLS; checking the network tab for leaked keys before each release; reviewing the `reports` table weekly; DB queries tracking users with 15+ rankings, blend counts, and leaderboard sizes.

---

## Team

| Member | Role | Focus |
|---|---|---|
| **Angel** | Backend Engineer | Database design and management: accounts, watch history, rankings, reviews, friendships (CSE 344 database experience) |
| **Riel** | Backend Engineer | Server-side logic and APIs: movie search, recommendations, community ratings, leaderboards (internship building financial web apps) |
| **Arni** | Frontend Engineer | Search UI, watch history pages, head-to-head comparison screens (CSS experience) |
| **Leon** | Frontend Engineer | Profiles, reviews, comments, recommendation displays, social features (frontend frameworks) |
| **Timothy** | UI/UX Designer | Layouts, navigation, movie cards, comparison and profile screens (UI design and frontend frameworks) |
| **Peter** | UI/UX Designer | Usability, user flows, feedback for ties/re-ranking, usability testing (HCI coursework) |

**Communication:** Instagram group chat and a Discord server (threads, text, and voice channels by topic).

**Role changes:** Notify the whole team on Instagram or Discord and confirm the swap with the member you're switching with.

---

## Documentation

- **User docs:** An in-app help menu reachable from the nav bar on every page. Covers head-to-head ranking, why scores unlock at 10 movies and recommendations at 15, plus an FAQ. Error messages tell users what to do next. A community guidelines page is linked from sign-up and the help menu.
- **Developer docs:** This README plus a `docs/` folder containing:
  - Architecture doc (components, interfaces, design changes)
  - Database doc (each table and its key columns)
  - API reference (each endpoint's request/response format and errors)
- **Admin docs:** A short moderator guide covering how reports reach the queue, how to review them, criteria for hiding content, and handling repeat abuse (removing bots, fake accounts, malicious profiles).
