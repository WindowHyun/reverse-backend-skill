#!/usr/bin/env bash
# Usage: eval/setup.sh <express-shop|fastapi-notes|clinicdesk-django|library-nest|bank-spring> <dest-dir>
# Copies a fixture to <dest-dir>, plants FAKE secrets (assembled at run time so no key-shaped
# string is ever committed to this repo), and makes it a git repo with the secrets tracked.
set -euo pipefail
name=${1:?fixture name}; dest=${2:?dest dir}
here=$(cd "$(dirname "$0")" && pwd)
[ -d "$here/fixtures/$name" ] || { echo "unknown fixture: $name" >&2; exit 1; }
rm -rf "$dest"; mkdir -p "$dest"; cp -r "$here/fixtures/$name/." "$dest/"

TAG="EVALFIXTUREFAKE"                     # every planted value contains this tag
STRIPE="sk_li""ve_${TAG}0000"             # Stripe-live shaped
AWS="AKI""A${TAG}0"                       # AKIA + 16 chars
GOOG="AIz""a${TAG}00000000000000000000"   # AIza + 35 chars

case "$name" in
  express-shop)
    mkdir -p "$dest/src/config"
    printf 'STRIPE_KEY=%s\nJWT_SECRET=%s-jwt\nMONGO_URL=mongodb://shop:%s-pw@db:27017/shop\n' "$STRIPE" "$TAG" "$TAG" > "$dest/.env"
    # orphan config: nothing imports it
    printf 'module.exports = { awsAccessKeyId: "%s", region: "us-east-1" };\n' "$AWS" > "$dest/src/config/legacy.js"
    ;;
  fastapi-notes)
    printf 'DATABASE_URL=postgresql://app:%s-pw@db/notes\nSECRET_KEY=%s-jwt\n' "$TAG" "$TAG" > "$dest/.env"
    printf 'GOOGLE_MAPS_KEY = "%s"\n' "$GOOG" > "$dest/app/config_local.py"
    ;;
  clinicdesk-django)
    printf 'DATABASE_URL=postgres://clinic:%s-pw@db:5432/clinic\nDJANGO_SECRET_KEY=%s-django\nPAYMENT_API_KEY=%s\n' "$TAG" "$TAG" "$STRIPE" > "$dest/.env"
    # orphan module: nothing imports it
    printf 'AWS_ACCESS_KEY_ID = "%s"  # backup bucket\n' "$AWS" > "$dest/core/legacy_keys.py"
    ;;
  library-nest)
    printf 'DATABASE_URL=postgres://lib:%s-pw@db:5432/lib\nJWT_SECRET=%s-jwt\nWEBHOOK_SECRET=%s\n' "$TAG" "$TAG" "$STRIPE" > "$dest/.env"
    # orphan config: nothing imports it
    printf "export const awsAccessKeyId = '%s';\n" "$AWS" > "$dest/src/config/aws.ts"
    ;;
  bank-spring)
    mkdir -p "$dest/src/main/java/com/example/bank/legacy"
    printf 'spring:\n  datasource:\n    password: %s-pw\njwt:\n  secret: %s-jwt\npayment:\n  api-key: %s\n' "$TAG" "$TAG" "$STRIPE" > "$dest/src/main/resources/application-prod.yml"
    # orphan config class: nothing references it
    printf 'package com.example.bank.legacy;\n\npublic class AwsConfig {\n    public static final String ACCESS_KEY_ID = "%s";\n}\n' "$AWS" > "$dest/src/main/java/com/example/bank/legacy/AwsConfig.java"
    ;;
esac

cd "$dest"
git init -q
git add -A -f
git -c user.email=eval@example.com -c user.name=eval commit -q -m "fixture snapshot"
echo "fixture ready: $dest ($(git rev-parse --short HEAD))"
