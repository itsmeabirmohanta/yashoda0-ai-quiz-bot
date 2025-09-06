# Deployment Guide

This document provides instructions for deploying the QuizApp to various platforms.

## Prerequisites

Before deploying, ensure you have:
- A production build of the application (`npm run build`)
- A Supabase account and project set up
- Environment variables properly configured

## Environment Variables

Create a `.env.production` file with the following variables:

```
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Deploying to Vercel

1. Install Vercel CLI (optional):
   ```bash
   npm i -g vercel
   ```

2. Deploy using Vercel CLI:
   ```bash
   vercel
   ```
   
   Or deploy via the Vercel dashboard:
   - Connect your GitHub repository
   - Configure build settings:
     - Build command: `npm run build`
     - Output directory: `dist`
   - Add environment variables
   - Deploy

## Deploying to Netlify

1. Install Netlify CLI (optional):
   ```bash
   npm i -g netlify-cli
   ```

2. Deploy using Netlify CLI:
   ```bash
   netlify deploy
   ```
   
   Or deploy via the Netlify dashboard:
   - Connect your GitHub repository
   - Configure build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables
   - Deploy

## Deploying to GitHub Pages

1. Install gh-pages package:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add deployment scripts to package.json:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. Deploy to GitHub Pages:
   ```bash
   npm run deploy
   ```

## Deploying to a Traditional Web Server

1. Build the application:
   ```bash
   npm run build
   ```

2. Upload the contents of the `dist` folder to your web server using FTP, SCP, or any other file transfer method.

3. Configure your web server:
   
   For Apache, create a `.htaccess` file in the root directory:
   ```
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```
   
   For Nginx, add this to your server configuration:
   ```
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

## Database Migrations

After deploying the frontend, ensure your database is properly set up:

1. Apply initial migrations:
   ```bash
   supabase db push
   ```

2. Apply the quiz code field update:
   ```bash
   psql -f add_quiz_code_field_fixed.sql
   ```

## Post-Deployment Verification

After deploying, verify the following:

1. The application loads correctly
2. Authentication works properly
3. Quiz creation and participation function as expected
4. Database connections are established successfully
5. All environment variables are correctly set

## Troubleshooting

### Common Issues

1. **404 Errors on Routes**: Make sure your server is configured to handle client-side routing.

2. **API Connection Issues**: Verify your Supabase URL and API keys are correct.

3. **CORS Errors**: Ensure your Supabase project has the correct origins allowed in the API settings.

4. **Database Migration Failures**: Check for any error messages and ensure you're running migrations in the correct order.

### Getting Help

If you encounter issues that aren't covered here, please:
- Check the project's GitHub Issues
- Post a new issue with detailed information about the problem
- Include environment details, error messages, and steps to reproduce
