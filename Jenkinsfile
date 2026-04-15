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
        sh '''
          set -eux
          python3 --version
          python3 -m venv .venv-selenium
          . .venv-selenium/bin/activate
          pip install -r tests/selenium/requirements.txt
          python tests/selenium/smoke_scrape.py
        '''
      }
    }

    stage('Docker Build & Tag') {
      steps {
        sh 'command -v docker'
        sh 'docker build -f apps/web/Dockerfile -t ${IMAGE_REGISTRY}/ecommerce-web:${IMAGE_TAG} .'
        sh 'docker build -f services/auth-service/Dockerfile -t ${IMAGE_REGISTRY}/auth-service:${IMAGE_TAG} .'
        sh 'docker build -f services/product-service/Dockerfile -t ${IMAGE_REGISTRY}/product-service:${IMAGE_TAG} .'
        sh 'docker build -f services/order-service/Dockerfile -t ${IMAGE_REGISTRY}/order-service:${IMAGE_TAG} .'
      }
    }

    stage('Image Push') {
      steps {
        sh 'command -v docker'
        sh 'docker push ${IMAGE_REGISTRY}/ecommerce-web:${IMAGE_TAG} || true'
        sh 'docker push ${IMAGE_REGISTRY}/auth-service:${IMAGE_TAG} || true'
        sh 'docker push ${IMAGE_REGISTRY}/product-service:${IMAGE_TAG} || true'
        sh 'docker push ${IMAGE_REGISTRY}/order-service:${IMAGE_TAG} || true'
      }
    }

    stage('Kubernetes Deploy') {
      steps {
        sh 'command -v kubectl'
        sh 'kubectl apply -f k8s/ -R'
        sh 'kubectl -n ${K8S_NAMESPACE} rollout status deployment/frontend --timeout=180s'
        sh 'kubectl -n ${K8S_NAMESPACE} rollout status deployment/auth-service --timeout=180s'
        sh 'kubectl -n ${K8S_NAMESPACE} rollout status deployment/product-service --timeout=180s'
        sh 'kubectl -n ${K8S_NAMESPACE} rollout status deployment/order-service --timeout=180s'
      }
    }
  }
}
