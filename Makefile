.PHONY: dev test build prod-local hooks help
PORT ?= 3000

help: ## list make targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | sed 's/:.*## /\t/'

dev:  ## dev server with auto-reload on :3000
	@echo "\n  Open: http://localhost:$(PORT)\n  (dev VPS: forward port $(PORT) in the VS Code Ports tab first)\n"
	cd app && PORT=$(PORT) npm run dev
test: ## run tests
	cd app && npm test
build: ## build the production image
	docker build --target runtime -t urinal-test .
prod-local: build ## run the production image locally on :3001
	@echo "\n  Open: http://localhost:3001\n  (dev VPS: forward port 3001 in the VS Code Ports tab first)\n"
	docker run --rm -p 3001:3000 -v urinal-test-data:/data urinal-test
hooks: ## enable the repo git hooks (secret guard)
	git config core.hooksPath .githooks
