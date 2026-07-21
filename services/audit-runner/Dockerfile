FROM ghcr.io/puppeteer/puppeteer:23.10.4
USER root
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY index.js ./
USER pptruser
CMD ["node","index.js"]
