# Apply Quiz Deletion Fix
# Run this in PowerShell to fix the quiz deletion issue

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Applying quiz deletion permissions fix..."
Write-Host "Opening SQL file for you to execute in Supabase Dashboard..."
code "$scriptDirectory/supabase/fix_quiz_deletion.sql"

Write-Host "Please execute this SQL file in the Supabase Dashboard SQL Editor"
Write-Host "Visit: https://app.supabase.com/project/ugmzhjfgrdqrpklhjbyg/sql"
Write-Host "After applying the SQL, your quiz deletion should work permanently."
