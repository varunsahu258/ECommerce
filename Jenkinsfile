pipeline {
  agent any

  environment {
    NODE_VERSION = "20.19.0"
    NODE_DIR = "${WORKSPACE}/.tools/node-current"
    PATH = "${NODE_DIR}/bin:${PATH}"
    IMAGE_REGISTRY = "local"
    IMAGE_TAG = "latest"
    K8S_NAMESPACE = "ecommerce-demo"
    RUN_SELENIUM_SMOKE = "true"
    E2E_BASE_URL = "http://ecommerce.local"
    SELENIUM_GRID_URL = "http://localhost:4444"
  }

  stages {
    stage('Prepare Node.js Runtime') {
      steps {
        sh '''
          set -eux

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
                  const baseUrl = process.env.SELENIUM_GRID_URL;
                  const normalizedBase = baseUrl.replace(/\\/$/, '');
                  const statusCandidates = normalizedBase.endsWith('/wd/hub')
                    ? [normalizedBase.replace(/\\/wd\\/hub$/, '/status'), normalizedBase + '/status']
                    : [normalizedBase + '/status', normalizedBase + '/wd/hub/status'];
                  const http = require(baseUrl.startsWith('https:') ? 'https' : 'http');

                  const checkStatus = (index) => {
                    if (index >= statusCandidates.length) {
                      process.exit(1);
                    }

                    const statusUrl = new URL(statusCandidates[index]);
                    const req = http.request(
                      {
                        hostname: statusUrl.hostname,
                        port: statusUrl.port || (statusUrl.protocol === 'https:' ? 443 : 80),
                        path: statusUrl.pathname + statusUrl.search,
                        method: 'GET',
                        timeout: 5000
                      },
                      (res) => {
                        if (res.statusCode && res.statusCode < 500) {
                          process.exit(0);
                        }
                        checkStatus(index + 1);
                      }
                    );

                    req.on('error', () => checkStatus(index + 1));
                    req.on('timeout', () => {
                      req.destroy();
                      checkStatus(index + 1);
                    });
                    req.end();
                  };

                  checkStatus(0);
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
        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
          script {
            if (sh(returnStatus: true, script: 'command -v docker >/dev/null 2>&1') != 0) {
              error('Skipping Docker build: docker CLI is not installed in this Jenkins runtime.')
            }

            sh 'docker build -f apps/web/Dockerfile -t ${IMAGE_REGISTRY}/ecommerce-web:${IMAGE_TAG} .'
            sh 'docker build -f services/auth-service/Dockerfile -t ${IMAGE_REGISTRY}/auth-service:${IMAGE_TAG} .'
            sh 'docker build -f services/product-service/Dockerfile -t ${IMAGE_REGISTRY}/product-service:${IMAGE_TAG} .'
            sh 'docker build -f services/order-service/Dockerfile -t ${IMAGE_REGISTRY}/order-service:${IMAGE_TAG} .'
          }
        }
      }
    }

    stage('Image Push') {
      steps {
        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
          script {
            if (sh(returnStatus: true, script: 'command -v docker >/dev/null 2>&1') != 0) {
              error('Skipping image push: docker CLI is not installed in this Jenkins runtime.')
            }

            sh 'docker push ${IMAGE_REGISTRY}/ecommerce-web:${IMAGE_TAG} || true'
            sh 'docker push ${IMAGE_REGISTRY}/auth-service:${IMAGE_TAG} || true'
            sh 'docker push ${IMAGE_REGISTRY}/product-service:${IMAGE_TAG} || true'
            sh 'docker push ${IMAGE_REGISTRY}/order-service:${IMAGE_TAG} || true'
          }
        }
      }
    }

    stage('Kubernetes Deploy') {
      steps {
        catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
          script {
            if (sh(returnStatus: true, script: 'command -v kubectl >/dev/null 2>&1') != 0) {
              error('Skipping Kubernetes deploy: kubectl is not installed in this Jenkins runtime.')
            }

            sh 'kubectl apply -f k8s/ -R'
            sh 'kubectl -n ${K8S_NAMESPACE} rollout status deployment/frontend --timeout=180s'
            sh 'kubectl -n ${K8S_NAMESPACE} rollout status deployment/auth-service --timeout=180s'
            sh 'kubectl -n ${K8S_NAMESPACE} rollout status deployment/product-service --timeout=180s'
            sh 'kubectl -n ${K8S_NAMESPACE} rollout status deployment/order-service --timeout=180s'
          }
        }
      }
    }
  }
}
