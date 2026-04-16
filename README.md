# Sustainable Acts of Kindness

A full-stack web application that helps users discover, track, and share 
everyday sustainable actions — turning small eco-friendly habits into a 
community-driven movement.

## Live Demo
[View the app](https://benevolent-smakager-b58e25.netlify.app/)

## Screenshots
<img width="1801" height="851" alt="Screenshot 2026-04-16 at 3 59 44 PM" src="https://github.com/user-attachments/assets/9c40cbb7-d378-47ab-b1f6-4c5d0a4ecdf9" />
<img width="1656" height="844" alt="Screenshot 2026-04-16 at 4 00 30 PM" src="https://github.com/user-attachments/assets/57c775f9-56af-448a-9133-d4844fc98e9e" />
<img width="1615" height="800" alt="Screenshot 2026-04-16 at 4 00 13 PM" src="https://github.com/user-attachments/assets/c93777e7-94f9-4c58-8e90-fc7be917bce4" />

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
