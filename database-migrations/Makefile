# ============================================================
# SIMO — Database Migration
# Jalankan dari folder: database-migrations/
# Butuh: node, npm
# ============================================================

.PHONY: help install migrate seed fresh reset status

help:
	@echo ""
	@echo "  SIMO — Database Migration Commands"
	@echo "  ==================================="
	@echo "  Jalankan dari folder database-migrations/"
	@echo ""
	@echo "  make install   Install dependencies (pg, dotenv)"
	@echo "  make migrate   Jalankan migration yang belum dijalankan"
	@echo "  make seed      Jalankan seed data"
	@echo "  make fresh     Drop semua tabel + migrate + seed ulang"
	@echo "  make reset     Drop semua tabel (tanpa re-migrate)"
	@echo "  make status    Tampilkan status setiap file migration"
	@echo ""
	@echo "  Pastikan .env sudah diisi sebelum menjalankan perintah di atas."
	@echo ""

install:
	npm install

migrate: install
	node migrate.js up

seed: install
	node migrate.js seed

fresh: install
	node migrate.js fresh

reset: install
	node migrate.js reset

status: install
	node migrate.js status
