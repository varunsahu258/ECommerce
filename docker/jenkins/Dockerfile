FROM jenkins/jenkins:lts

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    docker.io \
    kubernetes-client \
    python3 \
    python3-pip \
    chromium \
    chromium-driver \
  && rm -rf /var/lib/apt/lists/*

USER jenkins
