#!/usr/bin/env bash
#
# One-time setup for the /admin login.
#
# Sveltia CMS commits to GitHub on the editor's behalf, so it needs a tiny
# OAuth broker. This deploys one as a Cloudflare Worker. Run it once.
#
#   ./scripts/setup-cms.sh

set -Eeuo pipefail
B=$'\033[1m'; N=$'\033[0m'; Y=$'\033[33m'

cat <<EOF

${B}Step 1 — create a GitHub OAuth app${N}

  https://github.com/settings/developers  ->  New OAuth App

    Application name:     Ucar Motors CMS
    Homepage URL:         https://ucarmotors.pages.dev
    Callback URL:         https://ucar-cms-auth.<your-subdomain>.workers.dev/callback

  Copy the Client ID, then generate a Client Secret.

EOF

read -rp "GitHub Client ID: " GH_ID
read -rsp "GitHub Client Secret: " GH_SECRET; echo

WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

echo
echo "${B}Step 2 — deploying the auth worker${N}"
git clone --depth 1 https://github.com/sveltia/sveltia-cms-auth.git "$WORKDIR/auth"
cd "$WORKDIR/auth"
npm install

npx wrangler deploy --name ucar-cms-auth

echo "$GH_ID"     | npx wrangler secret put GITHUB_CLIENT_ID     --name ucar-cms-auth
echo "$GH_SECRET" | npx wrangler secret put GITHUB_CLIENT_SECRET --name ucar-cms-auth

cat <<EOF

${B}Step 3 — finish up${N}

  1. Copy the workers.dev URL printed above.
  2. Go back to the GitHub OAuth app and set the callback to <that URL>/callback
  3. In public/admin/config.yml set:

        backend:
          repo: <owner>/<repo>
          base_url: <that URL>

  4. Commit, redeploy, and open https://ucarmotors.pages.dev/admin

  ${Y}Only GitHub accounts with write access to the repo can log in.${N}
  Add the sales manager as a collaborator with write permission.

EOF
