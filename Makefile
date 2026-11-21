.PHONY: dev test build prod-local hooks
dev:  ## dev server with auto-reload on :3000
	cd app && npm run dev
test: ## run tests
	cd app && npm test
build: ## build the production image
	docker build --target runtime -t urinal-test .
prod-local: build ## run the production image locally on :3001
	docker run --rm -p 3001:3000 -v urinal-test-data:/data urinal-test
hooks: ## enable the repo git hooks (secret guard)
	git config core.hooksPath .githooks
