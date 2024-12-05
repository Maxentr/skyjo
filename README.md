<p align="center">
  <a href="https://www.skyjo.online">
    <img src="https://www.skyjo.online/svg/logo.svg" alt="Skyjo Online" width="400" />
  </a>
</p>

<p align="center">
  <img alt="Sonar Quality Gate (branch)" src="https://img.shields.io/sonar/quality_gate/maxentr_skyjo/trunk?server=https%3A%2F%2Fsonarcloud.io">
  <img alt="Sonar Tech Debt (branch)" src="https://img.shields.io/sonar/tech_debt/maxentr_skyjo/trunk?server=https%3A%2F%2Fsonarcloud.io">
  <img alt="Weblate project translated" src="https://img.shields.io/weblate/progress/skyjo-online">
  <img alt="GitHub License" src="https://img.shields.io/github/license/maxentr/skyjo">
</p>

This repository contains the code of [skyjo.online](https://www.skyjo.online), the online version of the popular card game Skyjo.

## Table of Contents

- [Table of Contents](#table-of-contents)
- [What is Skyjo?](#what-is-skyjo)
- [Project Structure](#project-structure)
  - [Applications](#applications)
  - [Packages](#packages)
- [Installation guide](#installation-guide)
  - [Prerequisites](#prerequisites)
  - [Installation steps](#installation-steps)
- [How to run the project](#how-to-run-the-project)
  - [Running the API without docker](#running-the-api-without-docker)
- [Localization](#localization)

## What is Skyjo?

Skyjo is an engaging card game that combines strategy, luck, and quick thinking. For more information, visit [skyjo.online/rules](https://www.skyjo.online/rules).

## Project Structure

This project is set up as a monorepo using [Turborepo](https://turbo.build/repo) and contains the following:

### Applications

- **api**: The game server built with [Hono](https://hono.dev/) and [Socket.IO](https://socket.io/)
- **web**: The web client built with [Next.js](https://nextjs.org/) and [shadcn/ui](https://ui.shadcn.com/)

### Packages

- **cache**: Manages game caching using [Redis](https://redis.io/)
- **config**: Centralized configuration files for the project
- **core**: Core game logic for Skyjo
- **error**: Custom error handling classes
- **logger**: Custom logger implemented with [Winston](https://github.com/winstonjs/winston) for logging in [Seq](https://datalust.co/seq)
- **shared**: Common types, utility functions, and [Zod](https://zod.dev/) schemas shared across applications

## Installation guide

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v22.10.0)
- [pnpm](https://pnpm.io/) (v9.14.4)
- [Docker](https://www.docker.com/) (v27.X.X)

### Installation steps
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy `.env.example` to `.env` in the root, `apps/api/`, and `apps/web/` directories, and fill out the required variables
3. Start the Seq container:
   ```bash
   docker compose up seq
   ```
4. Go to `localhost:5341` in your browser and enable authentication, create an account, generate an API key
5. Update the `SEQ_API_KEY` in `apps/api/.env` files with the generated API key

## How to run the project

To start the necessary services and clients:

To start Redis, Seq, and the API server in detached mode:
```bash
docker compose up -d
```

Run the web client with:
   ```bash
   pnpm dev --filter @skyjo/web
   ```

### Running the API without docker

In `apps/api/.env`, set:
```env
# Replace `REDIS_PASSWORD` with your Redis password
REDIS_URL=redis://:REDIS_PASSWORD@localhost:6379
```

Start the API server locally:
```bash
pnpm dev --filter @skyjo/api
```

## Localization

Thanks to [Weblate](https://hosted.weblate.org/engage/skyjo-online/) for hosting our localization infrastructure! If you'd like Skyjo Online available in your language, consider contributing to the translation.

<a href="https://hosted.weblate.org/engage/skyjo-online/">
<img src="https://hosted.weblate.org/widget/skyjo-online/web/horizontal-auto.svg" alt="Translation status" />
</a>
