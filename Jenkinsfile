pipeline {
  agent any

  environment {
    NODE_VERSION = "20.19.0"
    KUBECTL_VERSION = "v1.31.0"
    DOCKER_CLI_VERSION = "27.5.1"
    NODE_DIR = "${WORKSPACE}/.tools/node-current"
    TOOLS_BIN_DIR = "${WORKSPACE}/.tools/bin"
    PATH = "${TOOLS_BIN_DIR}:${NODE_DIR}/bin:${PATH}"
    IMAGE_REGISTRY = "local"
    IMAGE_TAG = "latest"
    K8S_NAMESPACE = "ecommerce-demo"
    RUN_SELENIUM_SMOKE = "true"
    E2E_BASE_URL = "http://ecommerce.local"
    SELENIUM_GRID_URL = "http://localhost:4444/wd/hub"
  }

  stages {
    stage('Prepare Node.js Runtime') {
      steps {
        sh '''
          set -eux
          mkdir -p "${TOOLS_BIN_DIR}"

          if [ ! -x "${NODE_DIR}/bin/npm" ]; then
            mkdir -p "${NODE_DIR}"
            arch="$(uname -m)"
            case "${arch}" in
              x86_64) node_arch="x64" ;;
              aarch64|arm64) node_arch="arm64" ;;
              *)
                echo "Unsupported architecture for Node bootstrap: ${arch}" >&2
                exit 1
                ;;
            esac

            node_distro="node-v${NODE_VERSION}-linux-${node_arch}"
            curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/${node_distro}.tar.gz" -o /tmp/node.tar.gz
            tar -xzf /tmp/node.tar.gz --strip-components=1 -C "${NODE_DIR}"
          fi

          node --version
          npm --version
        '''
      }
    }

    stage('Prepare Docker/Kubectl CLIs') {
      steps {
        sh '''
          set -eux

          arch="$(uname -m)"
          case "${arch}" in
            x86_64) docker_arch="x86_64"; k8s_arch="amd64" ;;
            aarch64|arm64) docker_arch="aarch64"; k8s_arch="arm64" ;;
            *)
              echo "Unsupported architecture for CLI bootstrap: ${arch}" >&2
              exit 1
              ;;
          esac

          if ! command -v docker >/dev/null 2>&1; then
            curl -fsSL "https://download.docker.com/linux/static/stable/${docker_arch}/docker-${DOCKER_CLI_VERSION}.tgz" -o /tmp/docker.tgz
            tar -xzf /tmp/docker.tgz -C /tmp
            install -m 0755 /tmp/docker/docker "${TOOLS_BIN_DIR}/docker"
          fi

          if ! command -v kubectl >/dev/null 2>&1; then
            curl -fsSL "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/${k8s_arch}/kubectl" -o "${TOOLS_BIN_DIR}/kubectl"
            chmod +x "${TOOLS_BIN_DIR}/kubectl"
          fi

          docker --version
          kubectl version --client
        '''
      }
    }

    stage('Install & Build') {
      steps {
        sh 'npm install'
        sh 'npm run build'
      }
    }

    stage('Unit Tests') {
      steps {
        sh 'npm run test:unit'
      }
    }

    stage('API / Integration Tests') {
      steps {
        sh 'npm run test:api'
      }
    }

    stage('Selenium Smoke Tests') {
      steps {
        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
          script {
            def gridStatus = sh(
              returnStatus: true,
              script: '''
                node -e "
                  const url = new URL(process.env.SELENIUM_GRID_URL);
                  const http = require(url.protocol === 'https:' ? 'https' : 'http');
                  const req = http.request(
                    {
                      hostname: url.hostname,
                      port: url.port || (url.protocol === 'https:' ? 443 : 80),
                      path: '/status',
                      method: 'GET',
                      timeout: 5000
                    },
                    (res) => process.exit(res.statusCode && res.statusCode < 500 ? 0 : 1)
                  );
                  req.on('error', () => process.exit(1));
                  req.on('timeout', () => { req.destroy(); process.exit(1); });
                  req.end();
                "
              '''
            )

            if (gridStatus != 0) {
              error("Skipping Selenium smoke tests: Selenium Grid is unreachable at ${env.SELENIUM_GRID_URL}.")
            }

            sh 'npm run test:selenium'
          }
        }
      }
    }

    stage('Docker Build & Tag') {
      steps {
        sh 'docker build -f apps/web/Dockerfile -t ${IMAGE_REGISTRY}/ecommerce-web:${IMAGE_TAG} .'
        sh 'docker build -f services/auth-service/Dockerfile -t ${IMAGE_REGISTRY}/auth-service:${IMAGE_TAG} .'
        sh 'docker build -f services/product-service/Dockerfile -t ${IMAGE_REGISTRY}/product-service:${IMAGE_TAG} .'
        sh 'docker build -f services/order-service/Dockerfile -t ${IMAGE_REGISTRY}/order-service:${IMAGE_TAG} .'
      }
    }

    stage('Image Push') {
      steps {
        sh 'docker push ${IMAGE_REGISTRY}/ecommerce-web:${IMAGE_TAG} || true'
        sh 'docker push ${IMAGE_REGISTRY}/auth-service:${IMAGE_TAG} || true'
        sh 'docker push ${IMAGE_REGISTRY}/product-service:${IMAGE_TAG} || true'
        sh 'docker push ${IMAGE_REGISTRY}/order-service:${IMAGE_TAG} || true'
      }
    }

    stage('Kubernetes Deploy') {
      steps {
        sh 'kubectl apply -f k8s/ -R'
        sh 'kubectl -n ${K8S_NAMESPACE} rollout status deployment/frontend --timeout=180s'
        sh 'kubectl -n ${K8S_NAMESPACE} rollout status deployment/auth-service --timeout=180s'
        sh 'kubectl -n ${K8S_NAMESPACE} rollout status deployment/product-service --timeout=180s'
        sh 'kubectl -n ${K8S_NAMESPACE} rollout status deployment/order-service --timeout=180s'
      }
    }
  }
}
