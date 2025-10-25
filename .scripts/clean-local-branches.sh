#!/usr/bin/env bash
set -euo pipefail

# Usage: ./clean-local-branches.sh [main-branch-name]
# Deletes local branches that:
#   1. Are not the current HEAD
#   2. Are merged into the specified main branch (default: main)
#   3. Have no upstream (remote tracking) branch

MAIN_BRANCH="${1:-main}"
CURRENT_BRANCH="$(git symbolic-ref --short HEAD)"

git fetch --prune

if ! git show-ref --verify --quiet "refs/heads/${MAIN_BRANCH}"; then
  echo "Error: local branch '${MAIN_BRANCH}' does not exist." >&2
  exit 1
fi

git for-each-ref --format='%(refname:short)' refs/heads/ \
  | while read -r branch; do
      if [[ "${branch}" == "${MAIN_BRANCH}" ]]; then
        continue
      fi
      if [[ "${branch}" == "${CURRENT_BRANCH}" ]]; then
        echo "skip  ${branch} (현재 체크아웃된 브랜치)"
        continue
      fi
      if git rev-parse --verify --quiet "${branch}@{upstream}" >/dev/null; then
        echo "skip  ${branch} (원격 추적 브랜치 존재)"
        continue
      fi
      if git merge-base --is-ancestor "${branch}" "${MAIN_BRANCH}"; then
        echo "delete ${branch}"
        git branch -d "${branch}"
      else
        echo "skip  ${branch} (아직 '${MAIN_BRANCH}'에 머지되지 않음)"
      fi
    done

echo "정리 완료."
