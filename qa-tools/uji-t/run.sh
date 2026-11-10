#!/bin/bash
# Jalankan uji T-01..T-05 (butuh Postgres lokal: node pgenv/up.js, lalu node pgenv/fix.js)
Q="$(cd "$(dirname "$0")/.." && pwd)"
cd "$Q/../backend"
export DATABASE_URL=postgresql://qa:qa@localhost:54329/simo_qa JWT_SECRET=nilai-uji-lokal-panjang-0123456789 GOOGLE_CLIENT_ID=x
for t in t01 t02 t03 t03b t04 t05; do echo "=== $t"; node -r "$Q/pgenv/preload.js" "$Q/uji-t/$t.js" 2>&1 | tail -15; echo "exit=${PIPESTATUS[0]}"; done
