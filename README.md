# UNIUN

This repo contains a Next.js frontend and a Node/Express backend with MongoDB, Neo4j, and optional Milvus, plus Prometheus/Grafana for metrics.

## Local development with Docker Compose

Prerequisites: Docker, Docker Compose.

1) Build and run all services

```bash
docker compose up --build
```

Services:
- frontend: http://localhost:3000
- backend: http://localhost:4000 (health: /health, metrics: /metrics)
- mongo: localhost:27017
- neo4j: http://localhost:7474 (bolt 7687, auth neo4j/neo4jpassword)
- milvus: 19530 (optional)
- prometheus: http://localhost:9090
- grafana: http://localhost:3001 (admin/admin)

Uploads are persisted to `./uploads` on the host and mounted into the backend container.

Environment:
- Frontend uses `NEXT_PUBLIC_API_URL` (defaults to http://localhost:4000) to talk to backend.
- Backend uses `PORT=4000`, `MONGO_URI=mongodb://mongo:27017/uniun`, `NEO4J_URI=bolt://neo4j:7687`, `NEO4J_USER=neo4j`, `NEO4J_PASSWORD=neo4jpassword`.

## Build images manually

```bash
docker build -t un1un1-backend:latest ./backend
docker build -t un1un1-frontend:latest ./frontend
```

## Deploy to AWS ECS (Fargate)

See `DeployToECS.md` for quick commands. We also provide:

- Task definition templates: `infra/ecs/taskdef-*.template.json`
- Service templates: `infra/ecs/service-*.template.json`
- Helper script: `scripts/deploy-ecs.sh`

Before running the script, export required networking and IAM values (do not commit secrets):

```bash
export SUBNET_ID_1=subnet-abc123
export SUBNET_ID_2=subnet-def456
export SECURITY_GROUP_ID=sg-0123456789abcdef0
export EXECUTION_ROLE_ARN=arn:aws:iam::123456789012:role/ecsTaskExecutionRole
export TASK_ROLE_ARN=arn:aws:iam::123456789012:role/ecsTaskRole
export JWT_SECRET=change-me
export MONGO_URI=mongodb://your-mongo:27017/uniun
export NEO4J_URI=bolt://your-neo4j:7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=strong-password
export NEXT_PUBLIC_API_URL=https://your-backend.example.com
```

Then:

```bash
bash scripts/deploy-ecs.sh
```

Security notes:
- Never commit real cloud credentials. Use AWS SSO, profiles, or env vars in your shell.
- Rotate and revoke any accidentally exposed keys in IAM immediately.

Easy Content Monetization App for Creators, SAAS
 
# Application Requirements:

## Menus and their corresponding contents:
    Home --> Feed with users interests or cosine similarity, Following Users feed, and Search users or content with cosine similarity list and input field for search.
    Shop --> ECommerce for content,Linking Users posts for Selling content, Buying posts.
    Trending --> Trending feeds of all creators/users
    Add/Upload --> (+) symbol to right of the screen to upload content for the user
    Messages --> Chat, Voice calls and Video calls for connecting with other users
    Profile --> Bio, Posts, Replies, Media and ETC of that user
    Tools --> Logout and system settings for the app, specific to user
    UNIUN --> Creator space for conference calls, with video, chat and screen share.

## Make a flexible application, should be adapted according to screen size, Both a Mobile and Website application:
    Landing page --> Home
    Home --> Feed, Following users feed, Search other user and their content (Top nav select for submenus)
    Side Nav Bar Menus --> Home, Shop, Trending, Messages, Profile, Tools, UNIUN
    Bottom Nav Bar --> Home, Shop, Add/Upload, Messages, Profile
    Colors --> Dark theme with colors Galaxy Black, Gold, Burgundy, Tangerine, and Olive Green.
    Content cards --> Should include media (image, video, or audio) text at the bottom, likes, replies, reposts, bookmark, views, shop link for the user, add to cart symbol, wishlist symbol, each post card should take 100% width, and page should contain at max 3 posts, vertical height should be fixed for clean and neat content visuals
    Shop cards --> Price, media, user, buy for other user, sell for the logged in user, Add to cart, Wishlist
    Trending --> Trending Feed metrics should be likes, reposts, and views
    Tools --> Logout, and other system settings like enable notifications, vibrations, silent, mic, video, gallery, location, and more.
    Messages --> Whatsapp like messaging with other users in the platform.
    Profile --> User feed at one place, posts, media, replies, reposts, profile edit, cart, wishlists, more, similar to X and Instagram
    UNIUN --> Conference calls interface like X spaces and  gmeet with other users in the platform.

## UI Library:
    USE SHADCN for UI Refer [SHAD CN DOCS](https://ui.shadcn.com/docs)
    UI SHOULD be modern, minimalistic, futuristic and clean with only SHADCN components
    UI and UX should look similar to https://x.com/ with colors black, gold and red as the theme colors of the site. The site should premium and end to end interactale with modern experience.

## Tech stack:
    Backend: NodeJs 
    Frontend: NextJs with Typescript and ReactJs with Shadcn Material UI
    DB: Neo4J, VectorDB, MongoDB
    Monitoring: Graphana, Prometheus

## Installation & Setup
        Quickstart (local, development):

        Prerequisites:
        - Docker & Docker Compose v2
        - Node.js 18+ (for local dev if not using Docker)

        1) Build and run with Docker Compose (recommended):

             Open a terminal at the repo root and run:

             ```bash
             docker compose build
             docker compose up
             ```

             This will build the frontend and backend images and start supporting services:
             - frontend: Next.js app on http://localhost:3000
             - backend: Node API on http://localhost:4000
             - neo4j: Graph DB (bolt on 7687, HTTP on 7474)
             - mongo: MongoDB (27017)
             - milvus: Vector DB for embeddings (stand-in for VectorDB)
             - prometheus: Monitoring on 9090
             - grafana: Dashboard on 3001

        2) Local development (without Docker):

             - Frontend:

                 cd frontend
                 npm install
                 npm run dev

             - Backend:

                 cd backend
                 npm install
                 npm run dev

        Configuration:
        - Environment variables are read from `.env` in each service directory (not checked in). Example env keys:
            - BACKEND_PORT, MONGO_URI, NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD

        Notes & next steps:
        - The scaffold provides a minimal, enterprise-friendly structure and health endpoints. It does not implement full product features (shadcn UI components, authentication, payments, media storage). Those are next steps.
        - See `docker-compose.yml` for service ports and credentials.

## Development quickstart

- Backend
    - Install deps: from `backend/` run `npm ci`
    - Build: `npm run build`
    - Run: `node dist/index.js` (works in degraded mode without Mongo/Neo4j)
    - Tests: `npm test` (integration tests auto-skip when MongoDB is unavailable)

- Frontend
    - Install deps: from `frontend/` run `npm ci`
    - Dev: `npm run dev`
    - Build: `npm run build`
    - Tests: `npm test` (Playwright e2e are excluded from Jest; run with `npm run e2e`)

Environment variables: see `backend/src/types.d.ts` for supported keys.
## Containerization & Deployment
    A `Dockerfile` is provided for both `frontend` and `backend`. Use the included `docker-compose.yml` for local orchestration. For production, adapt Dockerfiles to your cloud provider's build pipeline and replace development settings (for example, use a managed vector DB and managed Neo4j or cloud-hosted databases).
## Testing
    The scaffold includes basic health endpoints and a tiny test harness can be added with Jest/Playwright for unit and E2E tests. Add CI steps (GitHub Actions) to run lint, unit tests, and build.
## Monitoring
    Prometheus and Grafana are included in `docker-compose.yml`. The backend exposes a `/health` endpoint; instrument further metrics (Prometheus client) and add dashboards in Grafana.
## Future Scope
    Add Audio Content Page

## Copilot Instructions
Write end to end enterprise grade, clean, reusable, expandable, fully scalable code for this application using the requirements and techstack mentioned above.

## E2E & WebRTC notes

- Playwright E2E tests are scaffolded under `frontend/e2e`. To run them locally:

<!-- markdownlint-disable MD046 -->
```sh
# from repo root
npm install --workspaces=false
cd frontend
npm run e2e:install   # installs Playwright browsers
npm run e2e           # runs the tests against localhost:3000
```
<!-- markdownlint-enable MD046 -->

- The WebRTC demo (`/uniun`) supports configuring STUN/TURN servers via env vars:
    - `NEXT_PUBLIC_STUN` (defaults to `stun:stun.l.google.com:19302`)
    - `NEXT_PUBLIC_TURN` (optional, e.g. `turn:turn.example.com:3478`)

When running in CI, the GitHub Actions workflow `./github/workflows/e2e.yml` will start the Docker Compose stack and run Playwright tests.

## Linting

ESLint is configured for both frontend and backend.

Run lint:

```bash
cd frontend && npm run lint
# in another terminal
cd backend && npm run lint
```

## Milvus on Apple Silicon (arm64)

Milvus image used in docker-compose may not have an arm64 build. If you encounter platform errors on M1/M2:

- Option A: enable emulation by uncommenting `platform: linux/amd64` under the `milvus` service in `docker-compose.yml`.
- Option B: comment out the `milvus` service for local development if it's not required.

## Security audit note

The frontend may report one or more npm audit issues. Prefer upgrading the affected packages rather than using `--force`. Create an issue if you want us to propose a safe upgrade path.

## One-command background dev

From the repo root you can start both services in the background and check status/stop them:

```bash
# Start both in background (backend:4002, frontend:3002)
npm run dev:bg

# Check status and expected URLs
npm run dev:status

# Stop both
npm run dev:down
```

Environment knobs:

- BACKEND_PORT: default 4002
- FRONTEND_PORT: default 3002
- NEXT_PUBLIC_API_URL: defaults to <http://localhost:${BACKEND_PORT}>

Logs are written under .logs/backend.log and .logs/frontend.log.

## Docker local run

Prerequisites:

- Docker Desktop running (macOS: launch the Docker Desktop app first)
- Docker Compose v2

Build and run the full stack:

<!-- markdownlint-disable MD046 -->
```sh
docker compose build
docker compose up
```
<!-- markdownlint-enable MD046 -->

Services:

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:4000> (health at /health)
- MongoDB: localhost:27017
- Neo4j: <http://localhost:7474> (bolt: 7687)
- Prometheus: <http://localhost:9090>
- Grafana: <http://localhost:3001> (admin/admin)

Environment vars (optional):

- NEXT_PUBLIC_GOOGLE_CLIENT_ID (frontend)
- GOOGLE_CLIENT_ID (backend)

Troubleshooting:

- Error: Cannot connect to the Docker daemon… Ensure Docker Desktop is running, then retry `docker compose build`.
- On Apple Silicon, Milvus may require emulation (`platform: linux/amd64`) or can be commented out for local dev.

## Features

- **Notifications**: Users receive notifications for likes, reposts, and replies on their posts. A notification bell in the top navigation bar displays the number of unread notifications and a dropdown list of recent notifications.
- **Unique Username Validation**: New users are prevented from registering with a username that is already in use. The registration form provides real-time feedback on username availability.
- **Conditional UI**: The notification bell and settings icon are only visible to logged-in users.
