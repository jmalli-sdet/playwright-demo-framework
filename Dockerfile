#
# playwright-demo-framework • runner image
# Mirrors the image CI uses so `docker compose run tests` reproduces CI exactly.
#
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# Playwright image ships with a `pwuser` (uid 1000) with browsers pre-installed.
# Run the tests as that user — never as root.
USER root
WORKDIR /work

# Install deps as root first (faster + leverages Docker layer cache).
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy the rest of the project and hand ownership to the unprivileged user.
COPY . .
RUN chown -R pwuser:pwuser /work

USER pwuser

# CI env vars that flip the blob reporter on.
ENV CI=1 PLAYWRIGHT_BLOB=1

# Default command — overridable:
#   docker compose run --rm tests npx playwright test --grep @P1
CMD ["npx", "playwright", "test"]
