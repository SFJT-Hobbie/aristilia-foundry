#!/usr/bin/env bash
set -e
cd /mnt/d/FoundryVTT-System/aristilia
git tag -f v0.6.0
git push origin main
git push -f origin v0.6.0
echo "=== DONE ==="
git ls-remote --tags origin | grep v0.6.0 || echo "tag missing on remote"
