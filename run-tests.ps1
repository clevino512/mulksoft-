#!/usr/bin/env pwsh

# MuleSoft Integration Platform - Test Runner (Windows PowerShell)
# This script sets up MongoDB and runs the tests

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "MuleSoft Platform - Test Runner" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is available
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerCheck = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again."
    exit 1
}

# Check if MongoDB is running
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
$mongoCheck = docker ps | Select-String "mulesoft-mongodb"
if (-not $mongoCheck) {
    Write-Host "Starting MongoDB container..." -ForegroundColor Yellow
    docker-compose up -d mongodb
    Write-Host "Waiting for MongoDB to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
} else {
    Write-Host "MongoDB is already running!" -ForegroundColor Green
}

# Navigate to backend
Write-Host ""
Write-Host "Navigating to backend directory..." -ForegroundColor Yellow
cd backend

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install 2>&1 | Select-String -Pattern "added|up to date" | Select-Object -First 1

# Run tests
Write-Host ""
Write-Host "Running tests..." -ForegroundColor Green
npm run test

# Show exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All tests passed!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Tests failed with exit code: $LASTEXITCODE" -ForegroundColor Red
}

exit $LASTEXITCODE
