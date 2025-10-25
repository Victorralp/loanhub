@echo off
git config user.name "LoanHub"
git config user.email "loanhub@example.com"
git add .
git commit -m "Fix Vercel deployment - add npmrc, vercel config, and downgrade TypeScript"
git push origin main
