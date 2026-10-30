.PHONY: run test lint migrate build tidy

APP_NAME := api
PORT := 8080

run:
	go run ./cmd/api

test:
	go test ./... -race -cover

lint:
	golangci-lint run ./...

tidy:
	go mod tidy

build:
	CGO_ENABLED=0 GOOS=linux go build -o bin/$(APP_NAME) ./cmd/api

migrate:
	go run ./cmd/migrate

docker-up:
	docker compose up -d

docker-down:
	docker compose down

fmt:
	gofmt -w .