#!/bin/bash

# Rollback Script - MuleSoft Integration Platform
# Performs rollback of the deployment

set -e

echo "🔄 Rollback Script - MuleSoft Integration Platform"
echo "==================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Confirm rollback
confirm_rollback() {
    echo ""
    log_warning "This will rollback your deployment!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Rollback cancelled"
        exit 0
    fi
}

# List backups
list_backups() {
    log_info "Available backups:"
    
    BACKUPS=$(ls -1t "$PROJECT_ROOT/backups" 2>/dev/null || echo "")
    
    if [ -z "$BACKUPS" ]; then
        log_warning "No backups found"
        return
    fi
    
    echo "$BACKUPS" | nl
}

# Rollback from git commit
rollback_from_git() {
    local COMMIT=$1
    
    if [ -z "$COMMIT" ]; then
        log_error "No commit specified"
        exit 1
    fi
    
    log_info "Rolling back to commit $COMMIT..."
    
    cd "$PROJECT_ROOT"
    
    # Save current commit
    CURRENT_COMMIT=$(git rev-parse HEAD)
    log_info "Current commit: $CURRENT_COMMIT"
    
    # Checkout previous commit
    git checkout "$COMMIT" || {
        log_error "Failed to checkout commit $COMMIT"
        exit 1
    }
    
    log_success "Checked out commit $COMMIT"
    
    # Restart services
    log_info "Restarting services..."
    docker-compose down
    docker-compose build
    docker-compose up -d
    
    log_success "Services restarted with rolled back code"
    
    # Run health checks
    sleep 5
    curl -s http://localhost:5000/api/health > /dev/null
    if [ $? -eq 0 ]; then
        log_success "Rollback completed successfully!"
        log_info "Backend API is responding"
    else
        log_error "Rollback completed but health check failed"
        log_warning "You may need to manually verify the service"
    fi
}

# Rollback database
rollback_database() {
    local BACKUP_FILE=$1
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    log_warning "This will replace the current database with the backup!"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Database rollback cancelled"
        return
    fi
    
    log_info "Rolling back database from $BACKUP_FILE..."
    
    # Stop backend to release DB connection
    docker-compose stop backend
    
    # Restore backup
    docker exec mulesoft-mongodb mongorestore \
        --username admin \
        --password password123 \
        --authenticationDatabase admin \
        --drop \
        --archive="$BACKUP_FILE" \
        --gzip
    
    if [ $? -eq 0 ]; then
        log_success "Database restored successfully"
        
        # Restart backend
        docker-compose start backend
        log_success "Backend restarted"
    else
        log_error "Database restore failed"
        docker-compose start backend
        exit 1
    fi
}

# Show git history
show_git_history() {
    log_info "Recent commits:"
    echo ""
    cd "$PROJECT_ROOT"
    git log --oneline -10
    echo ""
}

# Main
main() {
    echo ""
    
    ROLLBACK_TYPE=${1:-"code"}
    
    case $ROLLBACK_TYPE in
        "code")
            confirm_rollback
            show_git_history
            echo ""
            read -p "Enter commit hash to rollback to: " COMMIT
            rollback_from_git "$COMMIT"
            ;;
        "database")
            list_backups
            echo ""
            read -p "Enter backup filename to restore from: " BACKUP
            rollback_database "$PROJECT_ROOT/backups/$BACKUP"
            ;;
        "all")
            confirm_rollback
            show_git_history
            read -p "Enter commit hash to rollback to: " COMMIT
            list_backups
            read -p "Enter backup filename (or press Enter to skip DB rollback): " BACKUP
            
            rollback_from_git "$COMMIT"
            
            if [ ! -z "$BACKUP" ]; then
                rollback_database "$PROJECT_ROOT/backups/$BACKUP"
            fi
            ;;
        *)
            log_error "Unknown rollback type: $ROLLBACK_TYPE"
            echo "Usage: $0 [code|database|all]"
            exit 1
            ;;
    esac
}

main "$@"
