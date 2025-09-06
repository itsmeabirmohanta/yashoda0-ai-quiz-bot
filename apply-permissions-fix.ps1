$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PGPASSWORD = "your_db_password" # Replace with your actual password if needed

Write-Host "Applying attempts permissions fix..."
# Get the SQL content from the file
$sql = Get-Content -Raw "$scriptDirectory/fix_attempts_permissions.sql"

# Execute the SQL using psql (if installed) or connect to your Supabase project using REST API
# If using Supabase UI, you would need to copy-paste this SQL into the SQL editor instead

# Alternative: Open the SQL file automatically in VS Code
Write-Host "Opening SQL file for you to execute in Supabase Dashboard..."
code "$scriptDirectory/fix_attempts_permissions.sql"

Write-Host "Applying answers permissions fix..."
# Get the SQL content from the file
$sql = Get-Content -Raw "$scriptDirectory/fix_answers_permissions.sql"

# Alternative: Open the SQL file automatically in VS Code
code "$scriptDirectory/fix_answers_permissions.sql"

Write-Host "Please execute these SQL files in the Supabase Dashboard SQL Editor"
Write-Host "Visit: https://app.supabase.com/project/ugmzhjfgrdqrpklhjbyg/sql"
