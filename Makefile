

init:
	@echo "Initializing project..."
	@go mod tidy
	@echo "Pulling latest dependencies..."
	@git pull origin main
	@read -p "Create .env file? (y/n): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		echo "Creating env file..."; \
		touch .env; \
	else \
		echo "Skipping .env creation."; \
	fi
	@echo "Initialization complete."

push:
	@echo "Committing changes..."
	@git add .
	@git commit -m "$(m)"
	@echo "Pushing to remote repository..."
	@git push origin main
	@echo "Pushing commits complete."

check:
	@echo "Running code checks..."
	@go fmt ./...
	@go vet ./...
	@echo "Code checks complete."