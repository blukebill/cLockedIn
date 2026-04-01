# cLockedIn
SETUP & DEPENDENCIES (for backend):
  java 17+:
    verify with:
      java -version
  maven to run springboot
    verify with:
      mvn -version
  docker and docker compose
    verify with:
      docker --version
      docker compose version


to run backend:
  cd backend/api
  mvn spring-boot:run

  backend then runs on https://localhost:8080

NOTE:
  ensure docker containers are running before starting spring-boot
  backend depends on postgresql
  ports:  
    8080->spring-boot
    5432->postgresql




installing deps so far:
  chmod +x setupd.sh
  ./setup.sh


For frontend setup/testing (localhost):
  React + Vite
  Tailwind CSS
  Node.js

  VS Code Extensions:
  "ES7 + React/Redux/React-Native Snippets" by dsznajder
  "Prettier" by Prettier
  "ESLint" by Microsoft
  "Tailwind CSS IntelliSense" by Tailwind Labs
  "GitLens - Git supercharged" by GitKraken

  open terminal and run 'npm run dev'
  npm will return a localhost port (default: 5173)
  visit the destination in web browser