#!/usr/bin/env bash
# Usage: eval/setup.sh <express-shop|fastapi-notes> <dest-dir>
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
esac

cd "$dest"
git init -q
git add -A -f
git -c user.email=eval@example.com -c user.name=eval commit -q -m "fixture snapshot"
echo "fixture ready: $dest ($(git rev-parse --short HEAD))"
