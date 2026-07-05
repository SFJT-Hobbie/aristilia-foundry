#!/usr/bin/env bash
cd /mnt/d/FoundryVTT-System/aristilia
sleep 12
RID=$(gh run list --repo SFJT-Hobbie/aristilia-foundry --limit 1 --json databaseId --jq '.[0].databaseId')
echo "run: $RID"
gh run watch "$RID" --repo SFJT-Hobbie/aristilia-foundry --exit-status 2>&1 | tail -2
echo "=== assets ==="
gh release view v0.6.0 --repo SFJT-Hobbie/aristilia-foundry --json assets --jq '.assets[].name'
