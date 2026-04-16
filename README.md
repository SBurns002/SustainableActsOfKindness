# Sustainable Acts of Kindness

A full-stack web application that helps users discover, track, and share 
everyday sustainable actions — turning small eco-friendly habits into a 
community-driven movement.

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Database:** Custom schema with SQL migrations (PL/pgSQL)
- **Tooling:** ESLint, PostCSS

## Features
- User authentication (sign up, log in, log out via Supabase Auth)
- Browse and discover sustainable actions by category
- Track personal progress and completed acts
- Community feed to see what others are doing

## Database
This project uses Supabase with custom PostgreSQL migrations located in 
`/supabase/migrations`. The schema defines tables for users, acts, 
categories, and user activity tracking.

See [SUPABASE_CONFIGURATION_GUIDE.md](./SUPABASE_CONFIGURATION_GUIDE.md) 
for setup instructions.

## Running Locally

1. Clone the repo
   git clone https://github.com/SBurns002/SustainableActsOfKindness.git

2. Install dependencies
   npm install

3. Set up your environment variables
   Create a .env file and add your Supabase URL and anon key:
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

4. Run the development server
   npm run dev

## Author
Built by [SBurns002](https://github.com/SBurns002)
