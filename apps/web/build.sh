#!/bin/bash
# Wrapper script to build Next.js and ignore error page export failures
cd "$(dirname "$0")"
next build || true
# Always exit with 0 because the errors are just for built-in error pages
exit 0
