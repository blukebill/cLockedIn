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
