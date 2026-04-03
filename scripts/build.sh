#!/bin/bash

# Build Script - MuleSoft Integration Platform
# Builds Docker images locally

set -e

echo "🔨 Build Script - MuleSoft Integration Platform"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Define variables
PROJECT_NAME="mulesoft"
BUILD_DATE=$(date +%Y%m%d_%H%M%S)
VERSION="${1:-latest}"

echo -e "${YELLOW}📦 Configuration:${NC}"
echo "  Project: $PROJECT_NAME"
echo "  Version: $VERSION"
echo "  Build Date: $BUILD_DATE"
echo ""

# Build images
echo -e "${YELLOW}🏗️  Building Docker images...${NC}"

cd "$(dirname "$0")/.."

if [ "$VERSION" = "latest" ]; then
    docker-compose build --no-cache
else
    docker-compose build --no-cache \
        --build-arg BUILD_VERSION=$VERSION \
        --build-arg BUILD_DATE=$BUILD_DATE
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

# Optionally tag images
if [ ! -z "$2" ] && [ "$2" = "tag" ]; then
    echo -e "${YELLOW}🏷️  Tagging images...${NC}"
    
    docker tag mulesoft-backend:$VERSION $PROJECT_NAME/backend:$VERSION
    docker tag mulesoft-frontend:$VERSION $PROJECT_NAME/frontend:$VERSION
    
    echo -e "${GREEN}✅ Images tagged successfully!${NC}"
fi

# Show built images
echo -e "${YELLOW}📋 Built images:${NC}"
docker images | grep mulesoft

echo ""
echo -e "${GREEN}🎉 Build completed! Ready to deploy.${NC}"
echo -e "${YELLOW}Next step: Run ./scripts/deploy.sh${NC}"
