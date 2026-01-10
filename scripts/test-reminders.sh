#!/bin/bash

# Test Payment Reminder Processing Cron Job
# This script provides easy commands to test the reminder processing functionality

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

print_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --url URL        Base URL (default: http://localhost:3000)"
    echo "  -s, --secret SECRET  Cron secret for authentication"
    echo "  -q, --query          Run database queries to check state"
    echo "  -v, --verbose        Verbose output"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Test without auth"
    echo "  $0 -s your_secret                    # Test with cron secret"
    echo "  $0 -u https://your-app.com -s secret # Test production"
    echo "  $0 -q                                # Check database state first"
    echo "  $0 -v                                # Verbose output"
}

# Parse command line arguments
VERBOSE=false
RUN_QUERIES=false

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
        -q|--query)
            RUN_QUERIES=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
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

# Function to check database state
check_database_state() {
    print_info "Checking database state..."
    
    if [[ -f "scripts/test-db-queries.js" ]]; then
        print_info "Running database queries..."
        node scripts/test-db-queries.js --query="reminder-summary"
    else
        print_info "Database query script not found, checking via API..."
        
        # Check reminder stats
        print_info "Fetching reminder statistics..."
        curl -X GET "$BASE_URL/api/reminders/stats" \
            -H "Content-Type: application/json" \
            -s | jq '.' 2>/dev/null || echo "Failed to fetch stats or jq not installed"
        
        echo ""
        
        # Check reminders
        print_info "Fetching current reminders..."
        curl -X GET "$BASE_URL/api/reminders" \
            -H "Content-Type: application/json" \
            -s | jq '.reminders | length' 2>/dev/null || echo "Failed to fetch reminders"
    fi
    
    echo ""
}

# Function to test reminder processing
test_reminder_processing() {
    local method=$1
    local auth_header=""
    
    if [[ -n "$CRON_SECRET" ]]; then
        auth_header="-H \"Authorization: Bearer $CRON_SECRET\""
    fi
    
    print_info "Testing reminder processing with $method method..."
    print_info "URL: $BASE_URL/api/cron/process-reminders"
    
    if [[ -n "$CRON_SECRET" ]]; then
        print_info "Using cron secret authentication"
    else
        print_info "No authentication (make sure ALLOW_MANUAL_CRON_TRIGGER=true in .env)"
    fi
    
    echo ""
    print_info "Executing curl command..."
    
    # Build and show curl command if verbose
    if [[ "$VERBOSE" == true ]]; then
        local curl_cmd="curl -X $method \"$BASE_URL/api/cron/process-reminders\""
        if [[ -n "$CRON_SECRET" ]]; then
            curl_cmd="$curl_cmd -H \"Authorization: Bearer $CRON_SECRET\""
        fi
        curl_cmd="$curl_cmd -H \"Content-Type: application/json\""
        print_debug "Command: $curl_cmd"
        echo ""
    fi
    
    # Execute curl command
    local start_time=$(date +%s)
    
    if [[ -n "$CRON_SECRET" ]]; then
        response=$(curl -X "$method" "$BASE_URL/api/cron/process-reminders" \
            -H "Authorization: Bearer $CRON_SECRET" \
            -H "Content-Type: application/json" \
            -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
            -s)
    else
        response=$(curl -X "$method" "$BASE_URL/api/cron/process-reminders" \
            -H "Content-Type: application/json" \
            -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
            -s)
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo "$response"
    
    # Parse response for better feedback
    if echo "$response" | grep -q "HTTP Status: 200"; then
        print_success "Reminder processing completed successfully!"
        
        # Extract details if verbose
        if [[ "$VERBOSE" == true ]]; then
            local success=$(echo "$response" | jq -r '.success' 2>/dev/null)
            local errors=$(echo "$response" | jq -r '.errors' 2>/dev/null)
            local message=$(echo "$response" | jq -r '.message' 2>/dev/null)
            
            if [[ "$success" == "true" ]]; then
                print_success "Processing successful: $message"
            elif [[ "$success" == "false" ]]; then
                print_error "Processing had errors: $message (errors: $errors)"
            fi
        fi
    elif echo "$response" | grep -q "HTTP Status: 401"; then
        print_error "Authentication failed - check your CRON_SECRET"
    elif echo "$response" | grep -q "HTTP Status: 403"; then
        print_error "Manual trigger not allowed - add ALLOW_MANUAL_CRON_TRIGGER=true to .env"
    else
        print_error "Reminder processing failed or returned non-200 status"
    fi
    
    print_info "Total execution time: ${duration}s"
}

# Function to test API endpoints
test_api_endpoints() {
    print_info "Testing related API endpoints..."
    
    echo ""
    print_info "1. Testing reminder stats endpoint..."
    curl -X GET "$BASE_URL/api/reminders/stats" \
        -H "Content-Type: application/json" \
        -s | jq '.' 2>/dev/null || print_error "Failed to fetch stats"
    
    echo ""
    print_info "2. Testing reminders list endpoint..."
    local reminders_response=$(curl -X GET "$BASE_URL/api/reminders" \
        -H "Content-Type: application/json" \
        -s)
    
    local reminder_count=$(echo "$reminders_response" | jq '.reminders | length' 2>/dev/null)
    if [[ "$reminder_count" =~ ^[0-9]+$ ]]; then
        print_success "Found $reminder_count reminders"
    else
        print_error "Failed to fetch reminders list"
    fi
    
    echo ""
    print_info "3. Testing reminder settings endpoint..."
    curl -X GET "$BASE_URL/api/reminder-settings" \
        -H "Content-Type: application/json" \
        -s | jq '.' 2>/dev/null || print_error "Failed to fetch settings"
}

# Main execution
echo "=============================================="
echo "   Payment Reminder Processing Test Script"
echo "=============================================="
echo ""

# Check if server is running
print_info "Checking if server is running at $BASE_URL..."
if curl -s "$BASE_URL" > /dev/null; then
    print_success "Server is running"
else
    print_error "Server is not running at $BASE_URL"
    print_info "Make sure to run: npm run dev"
    exit 1
fi

echo ""

# Run database queries if requested
if [[ "$RUN_QUERIES" == true ]]; then
    print_info "=== PRE-PROCESSING DATABASE STATE ==="
    check_database_state
    echo "=============================================="
    echo ""
fi

# Test GET method (manual trigger)
print_info "=== TESTING GET METHOD (MANUAL TRIGGER) ==="
test_reminder_processing "GET"

echo ""
echo "=============================================="
echo ""

# Test POST method (production-like)
print_info "=== TESTING POST METHOD (PRODUCTION-LIKE) ==="
test_reminder_processing "POST"

echo ""
echo "=============================================="
echo ""

# Test API endpoints
print_info "=== TESTING RELATED API ENDPOINTS ==="
test_api_endpoints

echo ""
echo "=============================================="
echo ""

# Check database state after processing if requested
if [[ "$RUN_QUERIES" == true ]]; then
    print_info "=== POST-PROCESSING DATABASE STATE ==="
    check_database_state
    echo "=============================================="
    echo ""
fi

print_success "All tests completed!"
print_info "Check the output above for detailed results."

if [[ "$VERBOSE" == false ]]; then
    echo ""
    print_info "Tip: Use -v flag for verbose output with more details"
fi

if [[ "$RUN_QUERIES" == false ]]; then
    echo ""
    print_info "Tip: Use -q flag to check database state before/after processing"
fi