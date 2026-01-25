FROM node:20-slim

# Install pnpm
RUN npm install -g firestore-cli

# Default command to run tests
CMD ["firestore-cli", "get", "providers/GYRHOME/residents"]
