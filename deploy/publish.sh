#!/usr/bin/env bash
#
# Publish dist/ to S3-compatible static hosting.
#
# Credentials are never stored in this repository: use AWS_PROFILE, the standard
# AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY variables, or an ignored
# deploy/deploy.env.local file (see deploy.env.example).
#
# Cache policy is the part worth copying:
#   assets/*              immutable (hashed filenames)            → max-age=1y
#   index.html, sw.js,    must be revalidated, otherwise clients
#   registerSW.js,        keep an old shell / stale service worker → no-cache
#   manifest.webmanifest
#   everything else       short-lived default                     → max-age=1h
#
# Usage:
#   bash deploy/publish.sh              # upload the existing dist/
#   bash deploy/publish.sh --build      # run deploy/build.sh first
#   bash deploy/publish.sh --dry-run    # print the plan, touch nothing
#   bash deploy/publish.sh --delete     # remove objects that are no longer in dist/
#   bash deploy/publish.sh --help
#
# Configuration (environment variables, no defaults that could hit the wrong bucket):
#   S3_BUCKET        required
#   S3_REGION        default us-east-1
#   S3_ENDPOINT      default https://s3.<region>.amazonaws.com
#   S3_PUBLIC_URL    optional; printed at the end
#   S3_ACL           optional; omitted by default (recommended: bucket policy)
#   DEPLOY_ENV_FILE  optional; defaults to deploy/deploy.env.local
#
# Exit codes: 0 success; 1 environment/upload failure; 2 bad arguments.

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
DIST_DIR="${DIST_DIR:-${ROOT_DIR}/dist}"

ENV_FILE="${DEPLOY_ENV_FILE:-${SCRIPT_DIR}/deploy.env.local}"
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

S3_REGION="${S3_REGION:-us-east-1}"
S3_ENDPOINT="${S3_ENDPOINT:-https://s3.${S3_REGION}.amazonaws.com}"

CACHE_IMMUTABLE="public, max-age=31536000, immutable"
CACHE_REVALIDATE="no-cache"
CACHE_DEFAULT="public, max-age=3600"

BUILD=0
DELETE=0
DRY_RUN=0

log() { printf '[publish] %s\n' "$*"; }
step() { printf '\n==> %s\n' "$*"; }
warn() { printf '[publish] warn: %s\n' "$*" >&2; }
die() {
  printf '[publish] error: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'USAGE'
Usage: bash deploy/publish.sh [--build] [--delete] [--dry-run]

  --build      run deploy/build.sh before uploading
  --delete     delete objects that are not in dist/
  --dry-run    print the operations without writing to S3
  -h, --help   show this help

Required: S3_BUCKET (via environment or deploy/deploy.env.local)
Optional: S3_REGION, S3_ENDPOINT, S3_PUBLIC_URL, S3_ACL, DIST_DIR, DEPLOY_ENV_FILE
USAGE
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 ||
    die "missing $1. Install the AWS CLI v2: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
}

AWS_OPTS=(--region "$S3_REGION" --endpoint-url "$S3_ENDPOINT")
if [[ -n "${S3_ACL:-}" ]]; then
  AWS_OPTS+=(--acl "$S3_ACL")
fi

run_sync_root() {
  local args=(
    s3 sync "$DIST_DIR/" "s3://$S3_BUCKET/"
    --exclude "assets/*"
    --cache-control "$CACHE_DEFAULT"
    "${AWS_OPTS[@]}"
  )
  (( DELETE )) && args+=(--delete)
  (( DRY_RUN )) && args+=(--dryrun)
  aws "${args[@]}"
}

run_sync_assets() {
  local args=(
    s3 sync "$DIST_DIR/assets/" "s3://$S3_BUCKET/assets/"
    --cache-control "$CACHE_IMMUTABLE"
    "${AWS_OPTS[@]}"
  )
  (( DELETE )) && args+=(--delete)
  (( DRY_RUN )) && args+=(--dryrun)
  aws "${args[@]}"
}

run_copy() {
  local source_path="$1"
  local key="$2"
  local cache_control="$3"
  local content_type="${4:-}"
  local args=(
    s3 cp "$source_path" "s3://$S3_BUCKET/$key"
    --cache-control "$cache_control"
    "${AWS_OPTS[@]}"
  )
  [[ -n "$content_type" ]] && args+=(--content-type "$content_type")
  (( DRY_RUN )) && args+=(--dryrun)
  aws "${args[@]}"
}

upload() {
  step "Sync site root (everything except assets/)"
  run_sync_root

  step "Sync assets/ (immutable, 1 year)"
  run_sync_assets

  step "Revalidate entry documents, service worker and manifest"
  local file
  for file in index.html sw.js registerSW.js; do
    [[ -f "$DIST_DIR/$file" ]] && run_copy "$DIST_DIR/$file" "$file" "$CACHE_REVALIDATE"
  done

  local workbox
  for workbox in "$DIST_DIR"/workbox-*.js; do
    [[ -e "$workbox" ]] || continue
    run_copy "$workbox" "$(basename "$workbox")" "$CACHE_REVALIDATE"
  done

  if [[ -f "$DIST_DIR/manifest.webmanifest" ]]; then
    run_copy "$DIST_DIR/manifest.webmanifest" "manifest.webmanifest" \
      "$CACHE_REVALIDATE" "application/manifest+json"
  fi
}

main() {
  while (( $# > 0 )); do
    case "$1" in
      --build) BUILD=1 ;;
      --delete) DELETE=1 ;;
      --dry-run) DRY_RUN=1 ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        usage >&2
        printf '\n[publish] error: unknown argument: %s\n' "$1" >&2
        exit 2
        ;;
    esac
    shift
  done

  require_cmd aws

  if (( BUILD )); then
    step "Build dist/"
    bash "$SCRIPT_DIR/build.sh"
  fi

  [[ -n "${S3_BUCKET:-}" ]] || die "S3_BUCKET is not set; copy deploy.env.example to deploy.env.local or export it"
  [[ -d "$DIST_DIR" ]] || die "dist/ not found; run deploy/build.sh or pass --build"
  [[ -f "$DIST_DIR/index.html" ]] || die "dist/index.html is missing; the build is incomplete"

  if (( DRY_RUN )); then
    warn "--dry-run: no object will be written"
  fi
  if (( DELETE )); then
    warn "--delete: objects missing from dist/ will be removed from s3://${S3_BUCKET}/"
  fi

  step "Target"
  printf '  endpoint: %s\n' "$S3_ENDPOINT"
  printf '  region:   %s\n' "$S3_REGION"
  printf '  bucket:   s3://%s\n' "$S3_BUCKET"
  [[ -n "${S3_PUBLIC_URL:-}" ]] && printf '  public:   %s\n' "${S3_PUBLIC_URL%/}"

  upload

  step "Done"
  if (( DRY_RUN )); then
    printf '  dry run finished: nothing uploaded\n'
  else
    printf '  uploaded %s/ to s3://%s/\n' "$DIST_DIR" "$S3_BUCKET"
    [[ -n "${S3_PUBLIC_URL:-}" ]] && printf '  entry: %s/index.html\n' "${S3_PUBLIC_URL%/}"
  fi
}

main "$@"
