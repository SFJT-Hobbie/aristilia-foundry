#!/usr/bin/env bash
set -e
cd /mnt/d/FoundryVTT-System/aristilia
git add -A
git commit -q -m "$1" || echo "(nada que commitear)"
git tag -f "$2"
git push origin main
git push -f origin "$2"
echo "=== PUSHED $2 ==="
