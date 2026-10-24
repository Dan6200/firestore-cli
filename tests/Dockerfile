FROM node:20-slim

# Install pnpm
RUN npm install -g firestore-cli

# Default command to run tests
CMD ["NODE_OPTIONS='--experimental-vm-modules'", "jest", "test/e2e"]
