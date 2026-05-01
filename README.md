# cLockedIn

## Requirements

- Java 21
- Maven
- Docker and Docker Compose
- Node.js and npm

Verify them with:

```bash
java -version
mvn -version
docker --version
docker compose version
npm --version
```

## Install dependencies

```bash
./install-requirements.sh
```

`requirements.txt` is the dependency manifest used by the installer script.
`./setup.sh` is kept as a shortcut for the same installer.

## Run the whole project

From the repository root:

```bash
./run-dev.sh
```

This starts:

- PostgreSQL from `backend` with `docker compose up --build`
- Spring Boot from `backend/api` with `mvn spring-boot:run`
- Vite from `frontend` with `npm run dev`

The frontend runs at `http://localhost:5173`.
The backend runs at `http://localhost:8080`.
Press `Ctrl-C` in the script terminal to stop the app and shut down the database container.

## Run services manually

Database:

```bash
cd backend
docker compose up --build
```

Backend:

```bash
cd backend/api
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm run dev
```
