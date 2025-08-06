# Backend Dockerfile - Development
FROM node:20-alpine

# Install minimal dependencies
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies including devDependencies
RUN npm install --legacy-peer-deps || echo "Dependencies may have issues, continuing..."

# Generate Prisma client (skip if fails)
RUN npx prisma generate || echo "Prisma generation skipped"

# Expose port
EXPOSE 3001

# Start in development mode
CMD ["npm", "run", "dev"]
