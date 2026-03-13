# Tower Defense — commandes via Docker (Bun)
# Depuis la racine du projet : make dev, make build, make preview

BUN_IMAGE := oven/bun:latest
FRONT_DIR := $(CURDIR)/front

.PHONY: dev build preview shell ci simulate

RUNS ?= 100
SIMOUT ?= .
# Fichier de paramètres chargé par la simulation (éditer après analyse des rapports)
PARAMS ?= gameparams.json

# CI : install deps puis typage, tests, lint
ci:
	docker run --rm \
		-v "$(FRONT_DIR):/app" \
		-w /app \
		$(BUN_IMAGE) \
		sh -c "bun install && bun run ci"

# Serveur de dev (hot reload) — http://localhost:5173
dev:
	docker run --rm -it \
		-v "$(FRONT_DIR):/app" \
		-w /app \
		-p 5173:5173 \
		$(BUN_IMAGE) \
		run dev

# Build prod → front/dist/
build:
	docker run --rm \
		-v "$(FRONT_DIR):/app" \
		-w /app \
		$(BUN_IMAGE) \
		run build

# Servir les fichiers (preview, après make build tu peux servir dist/ manuellement si besoin)
preview:
	docker run --rm -it \
		-v "$(FRONT_DIR):/app" \
		-w /app \
		-p 5173:5173 \
		$(BUN_IMAGE) \
		run preview

# Shell dans le conteneur avec le dossier front monté
shell:
	docker run --rm -it \
		-v "$(FRONT_DIR):/app" \
		-w /app \
		$(BUN_IMAGE) \
		/bin/sh

# Simulation headless (équilibrage) : 3 profils (full, two, one), stats par profil, replay meilleure run chacun
# make simulate RUNS=50
# make simulate RUNS=100 SIMOUT=./out PARAMS=simulate-params.json
simulate:
	docker run --rm \
		-v "$(FRONT_DIR):/app" \
		-w /app \
		$(BUN_IMAGE) \
		bun run src/player/simulate.ts $(RUNS) $(SIMOUT) $(PARAMS)
