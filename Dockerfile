FROM node:20-slim

# Set working directory
WORKDIR /app

# Install dependencies (use --ci for faster, deterministic install from lockfile)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Expose port for Next.js app
EXPOSE 3000

ENV NODE_ENV production
ENV PORT 3000

# The default command runs the Next.js app.
# The worker service in docker-compose.yml will override this command to "npm run start:worker".
CMD ["npm", "run", "start"]
