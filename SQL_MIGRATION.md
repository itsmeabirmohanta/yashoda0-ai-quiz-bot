# SQL Migration Guide

This document explains the SQL migrations in the project and how to apply them.

## Migration Files

The project contains the following SQL migration files:

1. **Initial Schema** - `supabase/migrations/20250906131938_4afd3b1d-6ca0-4ce7-bbaf-a85d3630fbc5.sql`
   - Creates the main tables (quizzes, questions, attempts, answers)
   - Establishes relationships and constraints
   - Sets up row-level security policies
   - Creates indexes for performance

2. **Quiz Code Feature** - `add_quiz_code_field_fixed.sql`
   - Adds the quiz_code field to the quizzes table
   - Populates existing quizzes with random codes
   - Creates a function to automatically generate codes for new quizzes
   - Sets up a trigger to call this function on inserts

3. **Quiz Insert Policy** - `add_quiz_insert_policy.sql`
   - Adds additional row-level security policy for quiz insertion

4. **Permissions Fixes** - Various `fix_*.sql` files
   - Fix permissions for various tables
   - Enhance row-level security policies

## How to Apply Migrations

### Initial Setup

When setting up the project for the first time:

1. Make sure Supabase CLI is installed:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase (if not already done):
   ```bash
   supabase init
   ```

3. Apply the initial migration:
   ```bash
   supabase db push
   ```

### Applying Subsequent Migrations

For migrations that aren't part of the Supabase migrations folder:

#### Option 1: Using psql

1. Connect to your database:
   ```bash
   psql -h database.server.com -p 5432 -U username -d database_name
   ```

2. Run the SQL file:
   ```sql
   \i path/to/migration.sql
   ```

#### Option 2: Using the PowerShell script

For Windows users:
```powershell
.\apply-migration.ps1 -filename add_quiz_code_field_fixed.sql
```

### Migration Order

Apply migrations in this order:

1. Initial schema (`20250906131938_4afd3b1d-6ca0-4ce7-bbaf-a85d3630fbc5.sql`)
2. Quiz code feature (`add_quiz_code_field_fixed.sql`)
3. Quiz insert policy (`add_quiz_insert_policy.sql`)
4. Permissions fixes:
   - `fix_questions_permissions.sql`
   - `fix_answers_permissions.sql` 
   - `fix_attempts_permissions.sql`
   - `fix_rls_policies.sql`

## Verifying Migrations

After applying migrations, verify the schema:

```sql
-- Check table structure
\d+ quizzes

-- Verify quiz_code column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quizzes' AND column_name = 'quiz_code';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'quizzes';

-- Test the quiz code generation function
INSERT INTO quizzes (title) VALUES ('Test Quiz');
SELECT id, title, quiz_code FROM quizzes WHERE title = 'Test Quiz';
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure you have the necessary permissions to modify the schema
   - Check that you're connected as a superuser or database owner

2. **Duplicate Column**
   - If you see "column already exists" errors, the migration may have been partially applied
   - Skip that part of the migration or drop and recreate the column

3. **Missing References**
   - Ensure that referenced tables and columns exist before creating foreign keys
   - Apply migrations in the correct order

### Rollback

If you need to roll back a migration:

```sql
-- Example: Rollback quiz_code feature
ALTER TABLE public.quizzes DROP COLUMN IF EXISTS quiz_code;
DROP FUNCTION IF EXISTS generate_quiz_code();
DROP TRIGGER IF EXISTS set_quiz_code_on_insert ON public.quizzes;
```

## Best Practices

- Always back up your database before applying migrations
- Test migrations in a development environment first
- Use transactions where possible to ensure atomic changes
- Document any manual steps required after migration
