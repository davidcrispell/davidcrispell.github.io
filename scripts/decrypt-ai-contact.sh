#!/bin/zsh
set -euo pipefail

SERVICE="ai-contact.davidcrispell.github.io.age"

if (( $# != 1 )); then
  print -u2 "usage: $0 MESSAGE.age"
  print -u2 "plaintext is written to standard output"
  exit 2
fi

age --decrypt \
  --identity <(security find-generic-password -a "$USER" -s "$SERVICE" -w) \
  "$1"
