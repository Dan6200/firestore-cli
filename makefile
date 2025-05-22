# Variables
PKG_MANAGER = pnpm

.PHONY: all build run test clean

# Targets
all: build

build:
	$(PKG_MANAGER) build
