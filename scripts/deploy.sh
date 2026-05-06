#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="voxcraft"
BASE_DIR="/opt/${APP_NAME}"
CURRENT_LINK="${BASE_DIR}/current"

for f in /etc/nomad.d/.acl.env /etc/voxcraft/consul.env; do
    if [ -f "${f}" ]; then
        set -a; source "${f}"; set +a
    fi
done

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*" >&2; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*" >&2; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*" >&2; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

echo "=========================================="
echo "   VoxCraft — Deploy via Nomad"
echo "=========================================="
echo ""

check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        error "This script must be run as root (use sudo)."
        exit 1
    fi
}

check_nomad() {
    if ! command -v nomad &>/dev/null; then
        error "Nomad CLI not found. Install it first."
        exit 1
    fi

    if ! nomad server members 2>/dev/null | grep -q "alive"; then
        error "Nomad server is not running."
        error "Start it first: sudo systemctl start nomad"
        exit 1
    fi

    ok "Nomad is running."
}

ensure_raw_exec() {
    local nomad_config="/etc/nomad.d/nomad.hcl"

    if ! nomad node status -verbose -self 2>/dev/null | grep -q "raw_exec.*true"; then
        info "Enabling raw_exec driver in Nomad..."

        if [ ! -f "${nomad_config}" ]; then
            error "Nomad config not found at ${nomad_config}."
            exit 1
        fi

        if grep -q "driver.raw_exec.enable" "${nomad_config}"; then
            sed -i 's/"driver.raw_exec.enable"\s*=\s*"[01]"/"driver.raw_exec.enable" = "1"/' "${nomad_config}"
        elif grep -q "^client {" "${nomad_config}"; then
            sed -i '/^client {/a\\  options = {\n    "driver.raw_exec.enable" = "1"\n  }' "${nomad_config}"
        else
            echo -e '\nclient {\n  enabled = true\n  options = {\n    "driver.raw_exec.enable" = "1"\n  }\n}' >> "${nomad_config}"
        fi

        info "Restarting Nomad..."
        systemctl restart nomad
        sleep 3

        if nomad node status -verbose -self 2>/dev/null | grep -q "raw_exec.*true"; then
            ok "raw_exec driver enabled."
        else
            warn "Could not verify raw_exec. Job may fail."
        fi
    else
        ok "raw_exec driver already enabled."
    fi
}

check_source() {
    if [ ! -d "${SCRIPT_DIR}/backend/app" ]; then
        error "backend/app/ not found in ${SCRIPT_DIR}."
        error "Run this script from the VoxCraft project root."
        exit 1
    fi

    if [ ! -f "${SCRIPT_DIR}/backend/requirements.txt" ]; then
        error "backend/requirements.txt not found."
        exit 1
    fi
}

check_redis() {
    if ! command -v redis-server &>/dev/null; then
        error "redis-server not found on host. Install it first:"
        error "  sudo apt-get install -y redis-server"
        exit 1
    fi
    ok "redis-server $(redis-server --version | awk '{print $3}' | sed 's/v=//')"
}

get_version() {
    if [ -L "${CURRENT_LINK}" ]; then
        basename "$(readlink -f "${CURRENT_LINK}")"
    else
        echo "none"
    fi
}

next_version() {
    local current
    current="$(get_version)"
    if [ "$current" = "none" ]; then
        echo "v001"
        return
    fi
    local num
    num="${current#v}"
    num=$((10#$num + 1))
    printf "v%03d" "${num}"
}

setup_directories() {
    mkdir -p "${BASE_DIR}/releases"
    mkdir -p "${BASE_DIR}/data"
    mkdir -p "${BASE_DIR}/audio_output"
    mkdir -p "${BASE_DIR}/redis-data"
    ok "Directories: ${BASE_DIR}/{data,audio_output,redis-data}"
}

setup_env() {
    if [ ! -f "${BASE_DIR}/env.vars" ]; then
        info "Creating default env.vars..."
        cp "${SCRIPT_DIR}/scripts/env.vars" "${BASE_DIR}/env.vars"
        ok "Config: ${BASE_DIR}/env.vars"
    else
        ok "Config exists: ${BASE_DIR}/env.vars (not overwritten)"
    fi
}

deploy_version() {
    local version="$1"
    local target_dir="${BASE_DIR}/releases/${version}"

    info "Creating release ${version}..."
    mkdir -p "${target_dir}"

    info "Copying application code..."
    cp -r "${SCRIPT_DIR}/backend/app" "${target_dir}/"
    cp -r "${SCRIPT_DIR}/backend/workers" "${target_dir}/"
    cp "${SCRIPT_DIR}/backend/requirements.txt" "${target_dir}/"
    mkdir -p "${target_dir}/scripts"
    cp "${SCRIPT_DIR}/scripts/start_api.sh" "${target_dir}/scripts/"
    cp "${SCRIPT_DIR}/scripts/start_worker.sh" "${target_dir}/scripts/"
    cp "${SCRIPT_DIR}/scripts/start_frontend.sh" "${target_dir}/scripts/"
    chmod +x "${target_dir}/scripts/"*.sh

    local needs_venv=true
    if [ -d "${target_dir}/venv" ] && [ -x "${target_dir}/venv/bin/python" ]; then
        needs_venv=false
    fi

    if [ "$needs_venv" = true ]; then
        info "Creating virtual environment..."
        python3 -m venv "${target_dir}/venv"
        "${target_dir}/venv/bin/pip" install --upgrade pip --quiet
    fi

    info "Installing dependencies..."
    "${target_dir}/venv/bin/pip" install -r "${target_dir}/requirements.txt" --quiet

    ok "Release ${version} ready at ${target_dir}."
    echo "${target_dir}"
}

build_frontend() {
    local target_dir="$1"
    local frontend_dir="${SCRIPT_DIR}/frontend"

    info "Building frontend..."

    local user_home="/home/${SUDO_USER:-feojeda}"
    export PATH="${user_home}/.local/bin:${user_home}/.local/share/pnpm:${PATH}"

    if ! command -v pnpm &>/dev/null; then
        error "pnpm not found. Install it first."
        exit 1
    fi

    if ! command -v node &>/dev/null; then
        error "node not found. Install it first."
        exit 1
    fi

    cd "${frontend_dir}"

    if [ ! -d "node_modules" ]; then
        info "Installing frontend dependencies..."
        pnpm install --frozen-lockfile
    fi

    info "Building Next.js standalone..."
    NEXT_PUBLIC_API_URL=/api pnpm build

    local fe_target="${target_dir}/frontend"
    mkdir -p "${fe_target}"

    cp -r ".next/standalone/." "${fe_target}/"
    [ -d "public" ] && cp -r "public" "${fe_target}/public"
    mkdir -p "${fe_target}/.next/static"
    cp -r ".next/static/." "${fe_target}/.next/static/"

    cd "${SCRIPT_DIR}"
    ok "Frontend built and copied."
}

update_symlink() {
    local target_dir="$1"

    info "Updating current symlink..."
    ln -sfn "${target_dir}" "${CURRENT_LINK}"
    ok "Symlink: ${CURRENT_LINK} -> ${target_dir}"
}

deploy_nomad_job() {
    local nomad_job="${SCRIPT_DIR}/scripts/voxcraft.nomad"
    local version="$1"

    if [ ! -f "${nomad_job}" ]; then
        error "Nomad job file not found: ${nomad_job}"
        exit 1
    fi

    local tmp_job
    tmp_job="$(mktemp)"
    cp "${nomad_job}" "${tmp_job}"

    sed -i "s/version     = \"[^\"]*\"/version     = \"${version}\"/" "${tmp_job}"

    local job_status
    job_status="$(nomad job status -verbose voxcraft 2>/dev/null | grep "^Status" | awk '{print $4}' || echo "unknown")"

    if [ "${job_status}" = "dead" ]; then
        info "Job is dead, purging before re-submit..."
        nomad job stop -purge voxcraft >/dev/null 2>&1 || true
    fi

    info "Deploying to Nomad (version ${version})..."
    nomad job run "${tmp_job}"
    rm -f "${tmp_job}"
    ok "Nomad job submitted."
}

cleanup_old_releases() {
    local keep="${KEEP_RELEASES:-3}"
    local count
    count=$(ls -1d "${BASE_DIR}"/releases/v* 2>/dev/null | wc -l)

    if [ "$count" -le "$keep" ]; then
        return
    fi

    info "Cleaning up old releases (keeping last ${keep})..."
    ls -1d "${BASE_DIR}"/releases/v* | sort | head -n -"${keep}" | while read -r old_release; do
        if [ "$(readlink -f "${CURRENT_LINK}")" != "${old_release}" ]; then
            info "Removing old release: $(basename "${old_release}")"
            rm -rf "${old_release}"
        fi
    done
    ok "Cleanup done."
}

print_summary() {
    local version
    version="$(get_version)"

    echo ""
    echo "=========================================="
    echo "   Deploy Complete!"
    echo "=========================================="
    echo ""
    echo "  Version:       ${version}"
    echo "  Install dir:   ${CURRENT_LINK}"
    echo "  Data:          ${BASE_DIR}/data"
    echo "  Audio output:  ${BASE_DIR}/audio_output"
    echo "  Redis data:    ${BASE_DIR}/redis-data"
    echo ""
    echo "  Services:"
    echo "    Web:       http://localhost:3005"
    echo "    API:       http://localhost:8001"
    echo "    API docs:  http://localhost:8001/docs"
    echo "    Redis:     localhost:6379"
    echo ""
    echo "  Nomad:"
    echo "    nomad job status ${APP_NAME}"
    echo "    nomad job restart ${APP_NAME}"
    echo "    nomad job stop ${APP_NAME}"
    echo ""
    echo "  Consul:"
    echo "    UI:  http://localhost:8500"
    echo ""
    echo "  Logs:"
    echo "    nomad logs -f <alloc-id>"
    echo "    nomad logs -f -stderr <alloc-id>"
    echo ""
}

check_root
check_nomad
ensure_raw_exec
check_source
check_redis

VERSION="$(next_version)"
info "Deploying version ${VERSION}..."
echo ""

setup_directories
setup_env
TARGET_DIR="$(deploy_version "${VERSION}")"
build_frontend "${TARGET_DIR}"
update_symlink "${TARGET_DIR}"
deploy_nomad_job "${VERSION}"
cleanup_old_releases
print_summary
