#!/bin/bash

# Backup Database Script - MuleSoft Integration Platform
# Creates backup of MongoDB data

set -e

echo "💾 Database Backup Script - MuleSoft Integration Platform"
echo "=========================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Check if MongoDB container is running
check_mongodb() {
    log_info "Checking MongoDB status..."
    
    STATUS=$(docker inspect -f '{{.State.Running}}' mulesoft-mongodb 2>/dev/null || echo "false")
    
    if [ "$STATUS" != "true" ]; then
        log_error "MongoDB container is not running"
        exit 1
    fi
    
    log_success "MongoDB is running"
}

# Create backup directory
setup_backup_dir() {
    log_info "Setting up backup directory..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Set permissions
    chmod 755 "$BACKUP_DIR"
    
    log_success "Backup directory ready: $BACKUP_DIR"
}

# Perform backup
perform_backup() {
    log_info "Starting MongoDB backup..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.tar.gz"
    
    docker exec mulesoft-mongodb mongodump \
        --username admin \
        --password password123 \
        --authenticationDatabase admin \
        --archive="$BACKUP_FILE" \
        --gzip
    
    if [ $? -eq 0 ]; then
        # Get file size
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        
        log_success "Backup completed: $BACKUP_FILE (Size: $SIZE)"
        echo ""
        log_info "Backup details:"
        echo "  Date: $TIMESTAMP"
        echo "  File: $BACKUP_FILE"
        echo "  Size: $SIZE"
    else
        log_error "Backup failed"
        exit 1
    fi
}

# Cleanup old backups (keep last 7 days)
cleanup_old_backups() {
    log_info "Cleaning up old backups (keeping last 7 days)..."
    
    # Find files older than 7 days and delete them
    find "$BACKUP_DIR" -name "backup-*.tar.gz" -mtime +7 -delete
    
    log_success "Cleanup completed"
}

# List backups
list_backups() {
    echo ""
    log_info "Available backups:"
    echo ""
    ls -lh "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | awk '{print $9, "(" $5 ")"}' || log_warning "No backups found"
    echo ""
}

# Verify backup integrity
verify_backup() {
    local BACKUP_FILE=$1
    
    log_info "Verifying backup integrity..."
    
    # Test tar.gz file
    tar -tzf "$BACKUP_FILE" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "Backup verification successful"
    else
        log_error "Backup verification failed - file may be corrupted"
        exit 1
    fi
}

# Main
main() {
    echo ""
    
    check_mongodb
    setup_backup_dir
    perform_backup
    
    # Get the latest backup file
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup-*.tar.gz 2>/dev/null | head -1)
    if [ ! -z "$LATEST_BACKUP" ]; then
        verify_backup "$LATEST_BACKUP"
    fi
    
    cleanup_old_backups
    list_backups
    
    echo -e "${GREEN}🎉 Backup process completed!${NC}"
}

main "$@"
