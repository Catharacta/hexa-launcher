param(
    [string]$Version
)

# 1. Input Version
if (-not $Version) {
    $Version = Read-Host "Enter release version (e.g. 0.2.4)"
}

if (-not $Version) {
    Write-Error "Version is required."
    exit 1
}

# Ensure v prefix handling
if ($Version -match "^v") {
    $VersionNum = $Version.Substring(1)
    $TagName = $Version
} else {
    $VersionNum = $Version
    $TagName = "v$Version"
}

Write-Host "Preparing release for version: $VersionNum (Tag: $TagName)" -ForegroundColor Green

# 2. Update Version in files
Write-Host "Updating version in files..."
node scripts/update-version.js $VersionNum
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to update version numbers."
    exit 1
}

# 3. Create Release Branch
$BranchName = "release/$TagName"
Write-Host "Creating release branch: $BranchName"
git checkout -b $BranchName
if ($LASTEXITCODE -ne 0) {
    # Try checking out if already exists
    git checkout $BranchName
}

# 4. Commit Changes
Write-Host "Committing changes..."
git add .
git commit -m "chore(release): prepare release $TagName"

# 5. Create Tag
Write-Host "Creating tag: $TagName"
# Delete tag if exists locally (for re-runs)
git tag -d $TagName 2>$null
git tag $TagName

# 6. Push Branch and Tag
Write-Host "Pushing branch and tag to origin..."
git push origin $BranchName
git push origin $TagName

Write-Host "Release preparation complete!" -ForegroundColor Cyan
Write-Host "GitHub Actions should now trigger the release build."
