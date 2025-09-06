# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Enhanced documentation for project setup and deployment
- Contributing guidelines for new developers
- Database schema documentation

## [1.0.0] - 2025-09-06

### Added
- Quiz code feature for easy access to quizzes
- Unique 6-character alphanumeric codes for each quiz
- Automatic code generation on quiz creation
- Database migration script for quiz code feature
- QuizGate component for code-based quiz access

### Fixed
- Row-level security policies for better data protection
- Permissions for attempts and answers tables
- Leaderboard sorting and filtering

### Changed
- Updated database schema with new quiz_code field
- Enhanced quiz sharing mechanism
- Improved admin dashboard with code display

### Optimized
- Added database indexes for faster queries
- Improved leaderboard performance
- Optimized authentication flows

## [0.9.0] - 2025-08-15

### Added
- Initial application structure
- Quiz creation and management functionality
- Question and answer system
- Participant attempt tracking
- Basic leaderboard functionality
- User authentication for administrators
- Supabase integration for backend services
- React with TypeScript frontend
- shadcn/ui components for UI
- Tailwind CSS for styling
- Responsive design for mobile and desktop

[unreleased]: https://github.com/itsmeabirmohanta/yashoda0-ai-quiz-bot/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/itsmeabirmohanta/yashoda0-ai-quiz-bot/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/itsmeabirmohanta/yashoda0-ai-quiz-bot/releases/tag/v0.9.0
