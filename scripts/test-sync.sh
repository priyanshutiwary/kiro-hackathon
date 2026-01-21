#!/bin/bash

# Test Invoice Sync Cron Job
# This script provides easy commands to test the invoice sync functionality

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
BASE_URL="http://localhost:3000"
CRON_SECRET=""

# Function to print colored output
print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --url URL        Base URL (default: http://localhost:3000)"
    echo "  -s, --secret SECRET  Cron secret for authentication"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Test without auth"
    echo "  $0 -s your_secret                    # Test with cron secret"
    echo "  $0 -u https://your-app.com -s secret # Test production"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -s|--secret)
            CRON_SECRET="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Function to test sync job
test_sync() {
    local method=$1
    local auth_header=""
    
    if [[ -n "$CRON_SECRET" ]]; then
        auth_header="-H \"Authorization: Bearer $CRON_SECRET\""
    fi
    
    print_info "Testing invoice sync with $method method..."
    print_info "URL: $BASE_URL/api/cron/sync-invoices"
    
    if [[ -n "$CRON_SECRET" ]]; then
        print_info "Using cron secret authentication"
    else
        print_info "No authentication (make sure ALLOW_MANUAL_CRON_TRIGGER=true in .env)"
    fi
    
    echo ""
    print_info "Executing curl command..."
    
    # Build curl command
    local curl_cmd="curl -X $method \"$BASE_URL/api/cron/sync-invoices\""
    
    if [[ -n "$CRON_SECRET" ]]; then
        curl_cmd="$curl_cmd -H \"Authorization: Bearer $CRON_SECRET\""
    fi
    
    curl_cmd="$curl_cmd -H \"Content-Type: application/json\" -w \"\\n\\nHTTP Status: %{http_code}\\nTime: %{time_total}s\\n\" -s"
    
    echo "Command: $curl_cmd"
    echo ""
    
    # Execute curl command
    if [[ -n "$CRON_SECRET" ]]; then
        response=$(curl -X "$method" "$BASE_URL/api/cron/sync-invoices" \
            -H "Authorization: Bearer $CRON_SECRET" \
            -H "Content-Type: application/json" \
            -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
            -s)
    else
        response=$(curl -X "$method" "$BASE_URL/api/cron/sync-invoices" \
            -H "Content-Type: application/json" \
            -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
            -s)
    fi
    
    echo "$response"
    
    # Check if successful
    if echo "$response" | grep -q "HTTP Status: 200"; then
        print_success "Sync job completed successfully!"
    else
        print_error "Sync job failed or returned non-200 status"
    fi
}

# Main execution
echo "==================================="
echo "   Invoice Sync Test Script"
echo "==================================="
echo ""

# Test GET method (manual trigger)
print_info "Testing GET method (manual trigger)..."
test_sync "GET"

echo ""
echo "==================================="
echo ""

# Test POST method (production-like)
print_info "Testing POST method (production-like)..."
test_sync "POST"

echo ""
print_info "Test completed!"
print_info "Check the terminal output above for sync results."

# curl -X POST http://localhost:3000/api/cron/process-reminders \
#   -H "Authorization: Bearer cron_secret"

# curl -X POST http://localhost:3000/api/cron/sync-invoices \    
#   -H "Authorization: Bearer cron_scret"