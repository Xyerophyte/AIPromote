# Frontend Dockerfile - Development
FROM node:20-alpine

# Install minimal dependencies
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN npm install --legacy-peer-deps || echo "Dependencies may have issues, continuing..."

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Expose port
EXPOSE 3000

# Start in development mode
CMD ["npm", "run", "dev"]
