#!/usr/bin/env bash
# Auto-update do site brunonyland.com
# - git pull
# - build (gera .br e .gz)
# - sincroniza dist/browser -> /var/www/brunonyland.com (preservando .well-known)
# - reload nginx
set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────
REPO_DIR="/projects/brunonyland.com"
DEPLOY_DIR="/var/www/brunonyland.com"
DIST_DIR="$REPO_DIR/dist/brunonyland.com/browser"
NGINX_SVC="nginx"
DRY_RUN=0

# ─── Cores ───────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'
  BLUE=$'\033[34m'; BOLD=$'\033[1m'; OFF=$'\033[0m'
else
  GREEN=''; YELLOW=''; RED=''; BLUE=''; BOLD=''; OFF=''
fi

log()   { printf '%s[%s]%s %s\n'  "$BLUE"   "$(date '+%H:%M:%S')" "$OFF" "$*"; }
ok()    { printf '%s[%s] OK%s   %s\n'      "$GREEN"  "$(date '+%H:%M:%S')" "$OFF" "$*"; }
warn()  { printf '%s[%s] !!%s   %s\n'      "$YELLOW" "$(date '+%H:%M:%S')" "$OFF" "$*"; }
die()   { printf '%s[%s] ERRO%s %s\n'      "$RED"    "$(date '+%H:%M:%S')" "$OFF" "$*" >&2; exit 1; }

# ─── Flags ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run|-n) DRY_RUN=1; shift ;;
    --help|-h)
      cat <<EOF
Uso: $0 [--dry-run|-n] [--help|-h]

  --dry-run  Mostra o que seria feito, sem alterar nada.
  --help     Esta ajuda.

Executa git pull + build + sync para $DEPLOY_DIR + reload nginx.
EOF
      exit 0 ;;
    *) die "Flag desconhecido: $1 (use --help)" ;;
  esac
done

if [[ $DRY_RUN -eq 1 ]]; then warn "DRY-RUN ativo — nada será alterado."; fi

# ─── Pré-condições ────────────────────────────────────────────────────────
[[ -d "$REPO_DIR/.git" ]] || die "Repo não encontrado em $REPO_DIR"
[[ -x /usr/bin/rsync ]]   || die "rsync necessário: sudo apt install rsync"
command -v npm   >/dev/null || die "npm não encontrado no PATH"
command -v nginx >/dev/null || die "nginx não encontrado no PATH"

cd "$REPO_DIR"

# ─── 1) git pull ───────────────────────────────────────────────────────────
log "git pull"
if [[ $DRY_RUN -eq 0 ]]; then
  git fetch --all --prune
  git pull --ff-only || die "git pull falou (mudanças locais?). Resetando: git status não está vazio."
else
  git fetch --all --prune
  git pull --ff-only --no-rebase || warn "(dry-run) conflito hipotético ignorado"
fi

# evita build com working tree suja
if ! git diff --quiet || ! git diff --cached --quiet; then
  die "Working tree suja. Faça commit/stash antes do deploy."
fi

# ─── 2) deps + build ───────────────────────────────────────────────────────
log "npm ci"
if [[ $DRY_RUN -eq 0 ]]; then
  npm ci --no-fund --no-audit
fi

log "npm run build (inclui compressão .br + .gz)"
PREV_HASH=$(git rev-parse HEAD)
if [[ $DRY_RUN -eq 0 ]]; then
  if ! npm run build; then die "Build falou"; fi
else
  echo "  (dry-run) ng build + node tools/compress.mjs"
fi

if [[ ! -d "$DIST_DIR" ]]; then
  die "Output $DIST_DIR não existe após build"
fi

# ─── 3) sincronização preservando .well-known ────────────────────────────
RSYNC_ARGS=(
  -av --delete
  --exclude='.well-known/'
  --exclude='letsencrypt/'
  --exclude='.htaccess'          # htaccess não é usado pelo nginx (Apache only)
  -c                             # checksum para maior segurança
)

log "rsync ${DIST_DIR} -> ${DEPLOY_DIR}"
if [[ $DRY_RUN -eq 1 ]]; then RSYNC_ARGS+=(--dry-run); fi

if [[ ! -d "$DEPLOY_DIR" ]]; then
  warn "Criando destino novo: $DEPLOY_DIR"
  if [[ $DRY_RUN -eq 0 ]]; then sudo mkdir -p "$DEPLOY_DIR"; fi
fi

RSYNC_SUDO=""
[[ -w "$DEPLOY_DIR" ]] || RSYNC_SUDO="sudo"

if [[ $DRY_RUN -eq 0 ]]; then
  $RSYNC_SUDO rsync "${RSYNC_ARGS[@]}" "$DIST_DIR/" "$DEPLOY_DIR/"
  ok "Arquivos sincronizados"
else
  $RSYNC_SUDO rsync "${RSYNC_ARGS[@]}" "$DIST_DIR/" "$DEPLOY_DIR/" || true
fi

# ─── 4) permissões e reload nginx ─────────────────────────────────────────
if [[ $DRY_RUN -eq 0 ]]; then
  # nginx worker normalmente roda como www-data; arquivos legíveis
  sudo chgrp -R www-data "$DEPLOY_DIR" 2>/dev/null || true
  sudo chmod -R a+rX "$DEPLOY_DIR"

  log "nginx -t"
  sudo nginx -t

  log "systemctl reload ${NGINX_SVC}"
  sudo systemctl reload "$NGINX_SVC"
  ok "nginx recarregado"
else
  echo "  (dry-run) chmod/chgrp/nginx -t/reload nginx"
fi

# ─── Resumo ────────────────────────────────────────────────────────────────
printf '\n%s══════════════════════════════════════════════════%s\n' "$BOLD" "$OFF"
ok "Deploy finalizado: https://brunonyland.com  (commit ${PREV_HASH:0:7})"
printf '%s══════════════════════════════════════════════════%s\n' "$BOLD" "$OFF"