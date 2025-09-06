# Contributing to QuizApp

Thank you for your interest in contributing to QuizApp! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

1. A clear, descriptive title
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Screenshots (if applicable)
6. Environment information (browser, OS, etc.)

### Suggesting Enhancements

We welcome feature requests! Please create an issue with:

1. A clear, descriptive title
2. A detailed description of the proposed feature
3. Any relevant examples or mockups

### Pull Requests

1. Fork the repository
2. Create a new branch from `main`
   ```sh
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
   ```sh
   npm run test
   ```
5. Commit your changes with a clear, descriptive message
   ```sh
   git commit -m "Add feature: your feature description"
   ```
6. Push to your fork
   ```sh
   git push origin feature/your-feature-name
   ```
7. Open a Pull Request to the `main` branch

## Development Setup

1. Clone the repository
   ```sh
   git clone https://github.com/itsmeabirmohanta/yashoda0-ai-quiz-bot.git
   cd quiz-app
   ```

2. Install dependencies
   ```sh
   npm install
   ```

3. Set up local environment
   ```sh
   # Copy the example environment file
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. Start the development server
   ```sh
   npm run dev
   ```

## Project Structure

```
quiz-app/
├── src/                  # Source code
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # External service integrations
│   ├── lib/              # Utility functions
│   ├── pages/            # Page components
│   └── types/            # TypeScript type definitions
├── supabase/             # Supabase configuration and migrations
├── public/               # Static assets
└── SQL files             # Database migrations and fixes
```

## Coding Standards

- Follow the existing code style
- Use TypeScript for type safety
- Write meaningful commit messages
- Include comments for complex logic
- Update documentation when necessary

## Testing

Before submitting a pull request, please ensure your code passes all tests:

```sh
npm run test
```

## License

By contributing to QuizApp, you agree that your contributions will be licensed under the project's license.

## Questions?

If you have any questions, feel free to open an issue for discussion.

Thank you for contributing to QuizApp!
