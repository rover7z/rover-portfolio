#!/data/data/com.termux/files/usr/bin/bash
set -e
PROJECT="$HOME/storage/downloads/rover-portfolio-github"
PATCH="$HOME/storage/downloads/rover-v6-patch"
if [ ! -d "$PROJECT/.git" ]; then
  echo "Project not found at: $PROJECT"
  exit 1
fi
cp -R "$PATCH"/* "$PROJECT"/
cd "$PROJECT"
git add .
git commit -m "Build Rover V6 personal hub" || true
git push
printf '\nV6 uploaded to GitHub. Vercel will deploy automatically.\n'
