pipeline {
  agent any

  environment {
    NODE_VERSION = "20.19.0"
    NODE_DISTRO = "node-v${NODE_VERSION}-linux-x64"
    NODE_ARCHIVE = "${NODE_DISTRO}.tar.gz"
    NODE_DIR = "${WORKSPACE}/.tools/${NODE_DISTRO}"
    PATH = "${NODE_DIR}/bin:${PATH}"
    IMAGE_REGISTRY = "local"
    IMAGE_TAG = "latest"
    K8S_NAMESPACE = "ecommerce-demo"
    RUN_SELENIUM_SMOKE = "true"
    E2E_BASE_URL = "http://ecommerce.local"
    SELENIUM_GRID_URL = "http://selenium-hub:4444/wd/hub"
  }

  stages {
    stage('Prepare Node.js Runtime') {
      steps {
        sh '''
          set -eux

          if [ ! -x "${NODE_DIR}/bin/npm" ]; then
            mkdir -p "${NODE_DIR}"
            curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/${NODE_ARCHIVE}" -o /tmp/node.tar.gz
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
        sh 'npm run test:selenium'
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
