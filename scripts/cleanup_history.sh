#!/bin/bash
# Script to clean sensitive data from git history
# WARNING: This will rewrite git history - use with caution!

set -e

echo "🔍 Scanning git history for sensitive data..."

# Install git-filter-repo if not present
if ! command -v git-filter-repo &> /dev/null; then
    echo "❌ git-filter-repo is required but not installed."
    echo "Install with: pip install git-filter-repo"
    exit 1
fi

# Create backup before proceeding
echo "📦 Creating backup..."
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
git bundle create backup_${BACKUP_DATE}.bundle --all

echo "✅ Backup created: backup_${BACKUP_DATE}.bundle"

# Clean .env files from history
echo "🧹 Removing .env files from history..."
git filter-repo --path MyShop/.env --invert-paths --force
git filter-repo --path frontend/.env --invert-paths --force

# Clean Stripe keys
echo "🧹 Removing Stripe test keys from history..."
git filter-repo --replace-text replace_patterns.txt --force

echo "✅ History cleaned!"
echo ""
echo "⚠️  IMPORTANT:"
echo "1. This has rewritten your git history"
echo "2. Push with: git push --force-with-lease"
echo "3. All team members need to re-clone the repository"
echo "4. Contact your team immediately about the history rewrite"
echo ""
echo "📋 Backup location: backup_${BACKUP_DATE}.bundle"
