FROM node:22-alpine

RUN apk add --no-cache git bash openssh-client curl docker-cli docker-cli-compose

RUN npm install -g opencode-ai

COPY opencode.json /root/.config/opencode/opencode.json

WORKDIR /workspace

EXPOSE 4096

CMD ["opencode", "serve", "--hostname", "0.0.0.0", "--port", "4096"]