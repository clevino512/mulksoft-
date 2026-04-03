#!/bin/bash

# Deploy Script - MuleSoft Integration Platform
# Deploys the application using Docker Compose

set -e

echo "🚀 Deploy Script - MuleSoft Integration Platform"
echo "================================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_requirements() {
    log_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_success "All requirements met"
}

# Load environment
load_environment() {
    log_info "Loading environment variables..."
    
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
        log_success "Environment loaded from .env"
    else
        log_warning ".env file not found, using defaults"
    fi
}

# Stop existing containers
stop_containers() {
    log_info "Stopping existing containers..."
    cd "$PROJECT_ROOT"
    docker-compose down --remove-orphans || true
    log_success "Containers stopped"
}

# Build images (if needed)
build_images() {
    if [ "$1" = "build" ]; then
        log_info "Building images..."
        cd "$PROJECT_ROOT"
        docker-compose build --no-cache
        log_success "Images built"
    fi
}

# Start services
start_services() {
    log_info "Starting services..."
    cd "$PROJECT_ROOT"
    
    docker-compose up -d
    
    log_success "Services started"
}

# Health checks
perform_health_checks() {
    log_info "Performing health checks..."
    
    sleep 5  # Wait for services to start
    
    # Check MongoDB
    log_info "Checking MongoDB..."
    docker exec mulesoft-mongodb mongosh --eval "db.adminCommand('ping')" &>/dev/null
    if [ $? -eq 0 ]; then
        log_success "MongoDB is healthy"
    else
        log_error "MongoDB health check failed"
    fi
    
    # Check Backend API
    log_info "Checking Backend API..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
    if [ "$RESPONSE" = "200" ]; then
        log_success "Backend API is healthy"
    else
        log_warning "Backend API returned status $RESPONSE"
    fi
    
    # Check Frontend
    log_info "Checking Frontend..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/index.html)
    if [ "$RESPONSE" = "200" ]; then
        log_success "Frontend is healthy"
    else
        log_warning "Frontend returned status $RESPONSE"
    fi
}

# Show running containers
show_status() {
    echo ""
    log_info "Running containers:"
    docker-compose ps
    echo ""
}

# Backup database (optional)
backup_database() {
    if [ "$1" = "backup" ]; then
        log_info "Backing up database..."
        
        BACKUP_DIR="$PROJECT_ROOT/backups"
        mkdir -p "$BACKUP_DIR"
        
        BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d_%H%M%S).tar.gz"
        
        docker exec mulesoft-mongodb mongodump \
            --username admin \
            --password password123 \
            --authenticationDatabase admin \
            --archive="$BACKUP_FILE" \
            --gzip
        
        log_success "Database backed up to $BACKUP_FILE"
    fi
}

# Main execution
main() {
    echo ""
    echo "🔧 Deployment Configuration:"
    echo "  Project Root: $PROJECT_ROOT"
    echo "  Node Env: ${NODE_ENV:-development}"
    echo ""
    
    check_requirements
    load_environment
    
    # Parse arguments
    BUILD_IMAGES=false
    RUN_HEALTH_CHECKS=true
    BACKUP_DB=false
    
    for arg in "$@"; do
        case $arg in
            "build")
                BUILD_IMAGES=true
                ;;
            "no-health-check")
                RUN_HEALTH_CHECKS=false
                ;;
            "backup")
                BACKUP_DB=true
                ;;
            *)
                log_warning "Unknown argument: $arg"
                ;;
        esac
    done
    
    backup_database $( [ "$BACKUP_DB" = true ] && echo "backup" )
    stop_containers
    build_images $( [ "$BUILD_IMAGES" = true ] && echo "build" )
    start_services
    
    if [ "$RUN_HEALTH_CHECKS" = true ]; then
        perform_health_checks
    fi
    
    show_status
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo "📚 Access your application:"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost:5000/api"
    echo "  MongoDB: localhost:27017"
}

# Run main function
main "$@"
