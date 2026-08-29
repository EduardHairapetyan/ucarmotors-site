#!/usr/bin/env bash
#
# Ucar Motors — build and ship to Cloudflare Pages.
#
#   ./scripts/deploy.sh              deploy to production
#   ./scripts/deploy.sh --preview    deploy to a preview branch
#   ./scripts/deploy.sh --domain     also attach the custom domain
#   ./scripts/deploy.sh --dry-run    build and audit only, upload nothing
#
# Idempotent: creates the Pages project on first run and reuses it after.

set -Eeuo pipefail

PROJECT="${CF_PROJECT:-ucarmotors}"
DOMAIN="${CF_DOMAIN:-ucarmotors.am}"
BUILD_DIR="dist"
NODE_MIN=20

PREVIEW=false; ATTACH_DOMAIN=false; DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --preview) PREVIEW=true ;;
    --domain)  ATTACH_DOMAIN=true ;;
    --dry-run) DRY_RUN=true ;;
    -h|--help) sed -n '2,11p' "$0"; exit 0 ;;
    *) echo "Unknown flag: $arg" >&2; exit 1 ;;
  esac
done

if [ -t 1 ]; then R=$'\033[31m'; G=$'\033[32m'; Y=$'\033[33m'; B=$'\033[1m'; N=$'\033[0m'
else R=""; G=""; Y=""; B=""; N=""; fi
step() { printf '\n%s==>%s %s%s%s\n' "$B" "$N" "$B" "$1" "$N"; }
ok()   { printf '  %s+%s %s\n' "$G" "$N" "$1"; }
warn() { printf '  %s!%s %s\n' "$Y" "$N" "$1"; }
die()  { printf '\n%serror:%s %s\n\n' "$R" "$N" "$1" >&2; exit 1; }
trap 'die "failed at line $LINENO"' ERR

# ------------------------------------------------------------------ preflight
step "Environment"
command -v node >/dev/null || die "node is not installed. Node ${NODE_MIN}+ required."
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge "$NODE_MIN" ] \
  || die "Node ${NODE_MIN}+ required, found $(node -v)"
ok "node $(node -v), npm $(npm -v)"
[ -f package.json ] || die "no package.json — run this from the project root."

if [ "$DRY_RUN" = false ]; then
  MISSING=()
  [ -n "${CLOUDFLARE_API_TOKEN:-}" ] || MISSING+=("CLOUDFLARE_API_TOKEN")
  [ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ] || MISSING+=("CLOUDFLARE_ACCOUNT_ID")
  [ ${#MISSING[@]} -eq 0 ] || die "missing env vars: ${MISSING[*]}

  Create a token with the 'Cloudflare Pages: Edit' permission at
  https://dash.cloudflare.com/profile/api-tokens

    cp .env.example .env && \$EDITOR .env
    set -a && source .env && set +a"
  ok "Cloudflare credentials present"
fi

# -------------------------------------------------------------------- install
step "Dependencies"
if [ -f package-lock.json ]; then npm ci --no-audit --no-fund
else warn "no package-lock.json — using npm install"; npm install --no-audit --no-fund; fi
ok "installed"

# ---------------------------------------------------------------------- audit
step "Content audit"

TOTAL=$(find src/content/cars -name '*.json' | wc -l | tr -d ' ')
UNVERIFIED=$(grep -l '"verified": false' src/content/cars/*.json 2>/dev/null | wc -l | tr -d ' ')
PRICED_UNVERIFIED=0
for f in src/content/cars/*.json; do
  if grep -q '"verified": false' "$f" && ! grep -q '"priceAmd": null' "$f"; then
    PRICED_UNVERIFIED=$((PRICED_UNVERIFIED + 1))
  fi
done

ok "$TOTAL cars, $((TOTAL - UNVERIFIED)) with a published price"
if [ "$UNVERIFIED" -gt 0 ]; then
  warn "$UNVERIFIED car(s) unverified — they render as \"price on request\" and emit no schema.org Offer"
fi
if [ "$PRICED_UNVERIFIED" -gt 0 ]; then
  warn "$PRICED_UNVERIFIED car(s) carry a price that is being withheld. Set verified:true to publish it."
fi

# Financing terms drive every payment figure on the site. Shipping stale ones
# to production is the single most expensive mistake available here.
if grep -q '"verified": false' src/content/settings/site.json; then
  if [ "$PREVIEW" = true ]; then
    warn "financing terms unconfirmed — fine for a preview"
  else
    die "financing terms in src/content/settings/site.json are marked verified:false.

  Every payment figure on the site is computed from that rate. Confirm the
  current rate, term and down-payment range with Ucar, set verified:true,
  or deploy with --preview."
  fi
else
  ok "financing terms confirmed"
fi

# ---------------------------------------------------------------------- build
step "Build"
npm run check
ok "0 type errors"
rm -rf "$BUILD_DIR"
npm run build
[ -d "$BUILD_DIR" ] || die "build produced no $BUILD_DIR directory"
ok "$(find "$BUILD_DIR" -name '*.html' | wc -l | tr -d ' ') pages, $(du -sh "$BUILD_DIR" | cut -f1)"

# Cheap smoke tests. Catch a silently-broken build before it reaches anyone.
grep -q 'application/ld+json' "$BUILD_DIR/index.html" || die "JSON-LD missing from the homepage"
grep -q 'hreflang="ru-RU"' "$BUILD_DIR/index.html"    || die "hreflang alternates missing"
[ -f "$BUILD_DIR/ru/index.html" ] && [ -f "$BUILD_DIR/en/index.html" ] || die "locale routes missing"
[ -f "$BUILD_DIR/sitemap-index.xml" ] || die "sitemap missing"
ok "smoke tests passed"

if [ "$DRY_RUN" = true ]; then
  step "Dry run complete"; echo "  Preview locally:  npx serve $BUILD_DIR"; exit 0
fi

# -------------------------------------------------------------------- project
step "Pages project"
if npx --yes wrangler@latest pages project list 2>/dev/null | grep -q "\b${PROJECT}\b"; then
  ok "'$PROJECT' exists"
else
  warn "'$PROJECT' not found — creating"
  npx --yes wrangler@latest pages project create "$PROJECT" --production-branch main
  ok "'$PROJECT' created"
fi

# --------------------------------------------------------------------- deploy
step "Deploy"
BRANCH="main"
if [ "$PREVIEW" = true ]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo preview)"
  [ "$BRANCH" = "main" ] && BRANCH="preview"
fi

LOG=$(mktemp); trap 'rm -f "$LOG"' EXIT
npx --yes wrangler@latest pages deploy "$BUILD_DIR" \
  --project-name "$PROJECT" --branch "$BRANCH" --commit-dirty=true | tee "$LOG"
URL=$(grep -oE 'https://[a-z0-9.-]+\.pages\.dev' "$LOG" | tail -1 || true)

if [ "$ATTACH_DOMAIN" = true ]; then
  step "Custom domain"
  if npx --yes wrangler@latest pages domain add "$DOMAIN" --project-name "$PROJECT" 2>/dev/null; then
    ok "$DOMAIN attached"
  else
    warn "could not attach $DOMAIN — already attached, or the zone is not on this account yet"
  fi
fi

step "Deployed"
[ -n "$URL" ] && echo "  $URL"
[ "$PREVIEW" = false ] && echo "  https://${PROJECT}.pages.dev"
echo
