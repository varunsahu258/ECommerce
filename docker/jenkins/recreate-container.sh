#!/usr/bin/env bash
set -euo pipefail

JENKINS_CONTAINER_NAME="${JENKINS_CONTAINER_NAME:-jenkins}"
JENKINS_HOME_VOLUME="${JENKINS_HOME_VOLUME:-jenkins_home}"
JENKINS_IMAGE="${JENKINS_IMAGE:-jenkins/jenkins:lts}"
JENKINS_HTTP_PORT="${JENKINS_HTTP_PORT:-8080}"
JENKINS_AGENT_PORT="${JENKINS_AGENT_PORT:-50000}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker CLI is required to recreate Jenkins container" >&2
  exit 1
fi

if docker ps -a --format '{{.Names}}' | grep -Fxq "${JENKINS_CONTAINER_NAME}"; then
  echo "Removing existing container ${JENKINS_CONTAINER_NAME}..."
  docker rm -f "${JENKINS_CONTAINER_NAME}" >/dev/null
fi

echo "Ensuring volume ${JENKINS_HOME_VOLUME} exists..."
docker volume create "${JENKINS_HOME_VOLUME}" >/dev/null

echo "Starting Jenkins container ${JENKINS_CONTAINER_NAME}..."
docker run -d \
  --name "${JENKINS_CONTAINER_NAME}" \
  -p "${JENKINS_HTTP_PORT}:8080" \
  -p "${JENKINS_AGENT_PORT}:50000" \
  -v "${JENKINS_HOME_VOLUME}:/var/jenkins_home" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  "${JENKINS_IMAGE}" >/dev/null

echo "Jenkins container started at http://localhost:${JENKINS_HTTP_PORT}"
echo "To unlock Jenkins, run:"
echo "docker exec -it ${JENKINS_CONTAINER_NAME} cat /var/jenkins_home/secrets/initialAdminPassword"
