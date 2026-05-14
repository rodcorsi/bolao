# Repository Guidelines

## Project Structure & Module Organization
This repository is a single Next.js app. Route entrypoints live in `pages/`, including dynamic pages such as `pages/matches/[id].tsx` and `pages/players/[id].tsx`. Reusable UI belongs in `components/`. Data access and ranking logic live in `lib/`. Global styling is in `styles/globals.css`. Static assets such as PIX images live in `public/images/`. Database schema changes should be reflected in `supabase/schema.sql`.

## Build, Test, and Development Commands
Use `bun run dev` to start the local Next.js server. Use `bun run build` to create the production build and catch build-time issues. Use `bun run start` to run the production build locally. Use `bun run lint` to run the Next.js ESLint ruleset. There is no dedicated automated test command in `package.json` yet, so linting and local page checks are the current baseline.

## Coding Style & Naming Conventions
TypeScript runs in `strict` mode; keep new code type-safe and avoid `any` unless there is no practical alternative. Follow the existing style: 2-space indentation, double quotes, semicolons, and React function components. Use PascalCase for component files such as `RankingList.tsx`, camelCase for helpers such as `getMatches.ts`, and route filenames that match the URL structure. Keep server-side data logic in `lib/` rather than inside presentational components.

## Configuration Notes
This app depends on Supabase and Redis-backed data flows under `lib/`. Document any new environment variables in the PR description and keep secrets out of the repository.
