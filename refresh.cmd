@echo off

REM without cache
docker-compose -f docker-compose.run.yml build --no-cache

REM run
run.cmd