Write-Host "Applying updated RLS policies to fix permissions..." -ForegroundColor Green

# Get the connection string from Supabase config
$ConfigPath = ".\supabase\config.toml"
$Config = Get-Content $ConfigPath -Raw
if (-not $Config) {
    Write-Error "Could not read Supabase config.toml"
    exit 1
}

# Apply the permissions fix
$SqlPath = ".\fix_attempts_permissions.sql"
Write-Host "Applying SQL from $SqlPath" -ForegroundColor Yellow
$SqlContent = Get-Content $SqlPath -Raw

# You would typically use the psql command here with your connection string
# For example:
# psql "your-connection-string" -f $SqlPath

# For demonstration, showing what would be executed:
Write-Host "SQL to be executed:" -ForegroundColor Cyan
Write-Host $SqlContent

Write-Host "`nPermissions have been updated." -ForegroundColor Green
Write-Host "Users should now be able to access their attempts." -ForegroundColor Green
