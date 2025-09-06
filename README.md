# QuizApp - Interactive Quiz Platform

## Overview

QuizApp is a feature-rich, interactive quiz platform that allows educators, trainers, and event organizers to create, manage, and distribute quizzes. Participants can join quizzes using unique quiz codes and compete on leaderboards.

### Key Features

- **🔐 User Authentication:** Secure admin access for quiz creation and management
- **📝 Quiz Creation:** Create quizzes with customizable questions and options
- **🎲 Randomization:** Option to shuffle questions and answers
- **⏱️ Timed Quizzes:** Set time limits per question
- **🏆 Leaderboards:** Real-time leaderboards to track participant performance
- **📱 Responsive Design:** Works on mobile and desktop devices
- **🔑 Access Codes:** Unique quiz codes for easy access
- **🧮 Flexible Scoring:** Multiple scoring strategies available

## Technology Stack

This project is built using modern web technologies:

- **Frontend:**
  - React 18 with TypeScript
  - Vite for fast development and optimized builds
  - React Router for navigation
  - shadcn/ui and TailwindCSS for beautiful UI components
  - React Query for data fetching and caching

- **Backend:**
  - Supabase for database, authentication, and API
  - PostgreSQL with row-level security policies
  - Supabase real-time subscriptions for live updates

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Git

### Installation

```sh
# Clone the repository
git clone https://github.com/itsmeabirmohanta/yashoda0-ai-quiz-bot.git

# Navigate to the project directory
cd quiz-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Database Structure

The application uses four main tables:

1. **quizzes** - Stores quiz metadata including unique quiz codes
2. **questions** - Contains questions for each quiz
3. **attempts** - Records participant quiz attempts
4. **answers** - Stores individual answers for each attempt

## Recent Updates

- **Quiz Code Feature:** Each quiz now has a unique 6-character alphanumeric code for easy access
- **Row-Level Security:** Enhanced security with proper permission policies
- **Performance Optimizations:** Added database indexes for faster queries

## Usage

### Admin Functions

1. Sign in using your admin credentials
2. Create a new quiz from the admin dashboard
3. Add questions and answer options
4. Set quiz parameters (time limits, shuffling, etc.)
5. Open the quiz for participation

### Participant Functions

1. Access the quiz using the provided quiz code
2. Enter your name to start the quiz
3. Answer questions within the time limit
4. View your results and position on the leaderboard

## Deployment

For detailed deployment instructions, please see [DEPLOYMENT.md](./DEPLOYMENT.md).

Quick deployment:
```sh
# Build the production version
npm run build

# Preview the production build locally
npm run preview
```

## Documentation

- [Database Schema](./DB_SCHEMA.md) - Detailed database structure and relations
- [Contributing Guidelines](./CONTRIBUTING.md) - How to contribute to this project

## License

This project is licensed under the [MIT License](./LICENSE).

## Acknowledgements

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.io/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)
