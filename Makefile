.PHONY: dev build prod-local
dev:  ## run the placeholder (later: the real dev server)
	cd app && node server.mjs
build: ## build the production image
	docker build --target runtime -t urinal-test .
prod-local: build ## run the production image locally on :3001
	docker run --rm -p 3001:3000 -v urinal-test-data:/data urinal-test
