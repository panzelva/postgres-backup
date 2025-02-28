FROM node:14-slim AS builder
ENV NODE_ENV development
WORKDIR /srv

COPY ["package.json", "yarn.lock", "./"] 
RUN yarn install --non-interactive --frozen-lockfile

COPY [".", "./"]
RUN yarn build

# =======================================================

FROM node:14-slim
ENV NODE_ENV production
WORKDIR /srv

COPY ["package.json", "yarn.lock", "./"] 
COPY --from=builder ["/srv/dist", "./"]

RUN mkdir -p /usr/share/man/man1 && \
  mkdir -p /usr/share/man/man7 && \
  apt-get update && \
  apt-get install -y gnupg2 wget lsb-release && \
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
  echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
  apt-get update && \
  apt-get install -y postgresql-client-12 && \
  yarn install --non-interactive --frozen-lockfile --production

CMD ["node", "app.js"]
