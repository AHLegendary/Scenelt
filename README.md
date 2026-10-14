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
├── README.md
├── public/              # Static assets
├── src/                 # Main application source code
│   ├── components/      # Reusable UI components
│   ├── pages/           # Application pages
│   ├── services/        # API and backend integrations
│   └── ...
├── supabase/            # Database configuration and migrations
├── .env                 # Environment variables
└── package.json         # Dependencies and scripts
```


## Getting Started

Once the project dependencies and configuration are in place:

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Configure the required environment variables for Supabase and the TMDb API.
4. Start the development server using the script defined in `package.json`.

See the project configuration and setup instructions for the exact commands and environment variables required.
