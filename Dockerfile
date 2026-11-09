# Mirrors Nike's runner image. Pinned Playwright image includes browsers.
FROM mcr.microsoft.com/playwright:v1.49.0-jammy
WORKDIR /work
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npx", "playwright", "test"]
