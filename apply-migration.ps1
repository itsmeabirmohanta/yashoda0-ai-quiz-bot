# PowerShell script to apply Supabase migrations

# Check if Supabase CLI is installed
if (!(Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "Supabase CLI not found. Installing..."
    # For Windows with PowerShell
    # This will download the latest release - modify if you need a specific version
    Invoke-WebRequest -Uri "https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.exe" -OutFile "supabase.exe"
    Move-Item -Force "supabase.exe" "$env:LOCALAPPDATA\Microsoft\WindowsApps\supabase.exe"
    Write-Host "Supabase CLI installed."
}

# Navigate to project directory (already there from the execution context, but just in case)
Set-Location -Path "C:\Users\Abir Mahanta\OneDrive\Documents\College-Coding\quiz-app"

# Login to Supabase
Write-Host "Please login to Supabase..."
supabase login

# Apply migrations
Write-Host "Applying migrations to Supabase..."
supabase db push

Write-Host "Migration complete! You can now restart your application."
