FROM node:22-bookworm-slim AS base

RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/debian.sources

RUN apt update

RUN apt install tzdata -y && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

RUN apt install jq -y

WORKDIR /app

FROM base AS diff

COPY ./package.json /app/package.json

COPY ./package-lock.json /app/package-lock.json

RUN cat /app/package-lock.json | jq 'del(.version)' | jq 'del(.packages."".version)' > /app/deps-lock.json

RUN cat /app/package.json | jq 'del(.version)' > /app/deps.json

FROM base AS build

WORKDIR /app

COPY --from=diff /app/deps.json /app/package.json

COPY --from=diff /app/deps-lock.json /app/package-lock.json

FROM build AS deps

WORKDIR /app

COPY --from=diff /app/deps-lock.json /app/package-lock.json

COPY --from=diff /app/deps.json /app/package.json

RUN npm install

FROM base AS tsruntime

WORKDIR /app

COPY . /app

COPY --from=deps /app/node_modules /app/node_modules

RUN npm run build

FROM node:22-bookworm-slim AS jsruntime

WORKDIR /app

RUN sed -i 's/deb.debian.org/mirrors.ustc.edu.cn/g' /etc/apt/sources.list.d/debian.sources

RUN apt update

RUN apt install tzdata -y && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

RUN apt install ffmpeg -y

COPY --from=tsruntime /app/dist /app/dist

COPY --from=deps /app/node_modules /app/node_modules