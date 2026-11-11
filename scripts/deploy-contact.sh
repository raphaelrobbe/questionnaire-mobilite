#!/usr/bin/env bash
# Déploie l’API de contact si un jeton Cloudflare est présent. Sinon, le site Pages part quand même.
set -euo pipefail
out="${GITHUB_OUTPUT:-}"
write() {
  if [ -n "$out" ]; then
    printf '%s\n' "$1" >> "$out"
  else
    printf '%s\n' "$1"
  fi
}

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] || [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  write "url=${VITE_CONTACT_URL:-}"
  echo "API de contact non déployée : jeton Cloudflare absent. Le site Pages part quand même."
  exit 0
fi

if [ -z "${SMTP_PASSWORD:-}" ] || [ -z "${TURNSTILE_SECRET_KEY:-}" ]; then
  echo "SMTP_PASSWORD et TURNSTILE_SECRET_KEY sont requis pour déployer l’API de contact." >&2
  exit 1
fi

log=$(bunx wrangler@4.46.0 deploy --config worker/wrangler.toml)
printf '%s\n' "$log"
printf '%s' "$SMTP_PASSWORD" | bunx wrangler@4.46.0 secret put SMTP_PASSWORD --config worker/wrangler.toml
printf '%s' "$TURNSTILE_SECRET_KEY" | bunx wrangler@4.46.0 secret put TURNSTILE_SECRET_KEY --config worker/wrangler.toml
url=$(printf '%s\n' "$log" | grep -oE 'https://[a-zA-Z0-9.-]+\.workers\.dev' | head -n 1 || true)
if [ -n "${VITE_CONTACT_URL:-}" ]; then
  url="$VITE_CONTACT_URL"
fi
write "url=${url}"
