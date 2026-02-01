#!/usr/bin/env bash
set -euo pipefail

dry_run=false
verify_only=false
root_dir="."
dry_run_actions=0
dry_run_skips=0

for arg in "$@"; do
  case "$arg" in
    -n|--dry-run)
      dry_run=true
      ;;
    --verify-only)
      verify_only=true
      ;;
    *)
      if [ "$root_dir" = "." ]; then
        root_dir="$arg"
      else
        echo "Error: unexpected argument $arg" >&2
        exit 1
      fi
      ;;
  esac
done

normalize() {
  local path="$1"
  if command -v realpath >/dev/null 2>&1; then
    realpath "$path"
    return
  fi

  python - <<'PY'
import os
import sys

print(os.path.realpath(sys.argv[1]))
PY
}

handle_claude_file() {
  local claude_path="$1"
  local dir_path
  dir_path="$(dirname "$claude_path")"
  local agents_path="$dir_path/AGENTS.md"
  local claude_name="CLAUDE.md"
  local agents_name="AGENTS.md"

  pushd "$dir_path" >/dev/null

  if [ -L "./$claude_name" ]; then
    if [ "$dry_run" = true ]; then
      echo "Dry-run: skip symlink $claude_path"
      dry_run_skips=$((dry_run_skips + 1))
    fi
    popd >/dev/null
    return
  fi

  if [ -e "./$agents_name" ]; then
    echo "Error: AGENTS.md already exists for $dir_path" >&2
    popd >/dev/null
    exit 1
  fi

  if [ "$dry_run" = true ]; then
    echo "Dry-run: mv ./$claude_name ./$agents_name"
    echo "Dry-run: ln -s ./$agents_name ./$claude_name"
    dry_run_actions=$((dry_run_actions + 1))
    popd >/dev/null
    return
  fi

  mv "./$claude_name" "./$agents_name"
  ln -s "./$agents_name" "./$claude_name"
  echo "Converted: $claude_path to symlink pointing to AGENTS.md"
  popd >/dev/null
}

verify_claude_file() {
  local claude_path="$1"
  local dir_path
  dir_path="$(dirname "$claude_path")"
  local agents_path="$dir_path/AGENTS.md"
  local claude_name="CLAUDE.md"
  local agents_name="AGENTS.md"

  pushd "$dir_path" >/dev/null

  if [ ! -L "./$claude_name" ]; then
    echo "Invalid: $claude_path is not a symlink" >&2
    popd >/dev/null
    return 1
  fi

  if [ ! -e "./$agents_name" ]; then
    echo "Invalid: $agents_path is missing" >&2
    popd >/dev/null
    return 1
  fi

  local target
  target="$(normalize "./$claude_name")"
  local expected
  expected="$(normalize "./$agents_name")"

  if [ "$target" != "$expected" ]; then
    echo "Invalid: $claude_path does not point to AGENTS.md" >&2
    popd >/dev/null
    return 1
  fi

  popd >/dev/null
  return 0
}

if [ "$verify_only" = true ]; then
  errors=0
  while IFS= read -r -d '' claude_path; do
    if ! verify_claude_file "$claude_path"; then
      errors=$((errors + 1))
    fi
  done < <(find "$root_dir" -name CLAUDE.md -print0)

  if [ "$errors" -ne 0 ]; then
    echo "Found $errors invalid CLAUDE.md entries" >&2
    exit 1
  fi

  echo "All CLAUDE.md files are symlinks to AGENTS.md"
  exit 0
fi

while IFS= read -r -d '' claude_path; do
  handle_claude_file "$claude_path"
done < <(find "$root_dir" -name CLAUDE.md -print0)

if [ "$dry_run" = true ]; then
  echo "Dry-run: would convert $dry_run_actions file(s), skipped $dry_run_skips symlink(s)"
fi
