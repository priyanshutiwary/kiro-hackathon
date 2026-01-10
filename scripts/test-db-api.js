#!/usr/bin/env node

/**
 * API-based Test Script for Payment Reminders
 * 
 * This script uses API endpoints to test reminder functionality
 * instead of direct database access.
 */

const https = require('https');
const http = require('http');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(level, message) {
  const timestamp = new Date().toISOString();
  const levelColors = {
    INFO: 'blue',
    SUCCESS: 'green',
    ERROR: 'red',
    WARN: 'yellow'
  };
  
  console.log(`${colorize('cyan', timestamp)} ${colorize(levelColors[level] || 'reset', `[${level}]`)} ${message}`);
}

// Default base URL
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test functions
async function testReminderProcessing() {
  log('INFO', 'Testing reminder processing endpoint...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/cron/process-reminders`);
    
    console.log('\n' + colorize('bright', '=== REMINDER PROCESSING RESULT ==='));
    console.log(`HTTP Status: ${colorize(response.status === 200 ? 'green' : 'red', response.status)}`);
    
    if (response.data && typeof response.data === 'object') {
      console.log(`Success: ${colorize(response.data.success ? 'green' : 'red', response.data.success)}`);
      console.log(`Message: ${colorize('yellow', response.data.message || 'N/A')}`);
      console.log(`Duration: ${colorize('cyan', response.data.duration || 'N/A')}ms`);
      console.log(`Errors: ${colorize(response.data.errors > 0 ? 'red' : 'green', response.data.errors || 0)}`);
      console.log(`Timestamp: ${colorize('magenta', response.data.timestamp || 'N/A')}`);
    } else {
      console.log(`Response: ${colorize('yellow', JSON.stringify(response.data, null, 2))}`);
    }
    
    console.log('');
    
    if (response.status === 200) {
      log('SUCCESS', 'Reminder processing completed successfully');
    } else {
      log('ERROR', `Reminder processing failed with status ${response.status}`);
    }
    
  } catch (error) {
    log('ERROR', `Failed to test reminder processing: ${error.message}`);
  }
}

async function getReminderStats() {
  log('INFO', 'Fetching reminder statistics...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/reminders/stats`);
    
    console.log('\n' + colorize('bright', '=== REMINDER STATISTICS ==='));
    console.log(`HTTP Status: ${colorize(response.status === 200 ? 'green' : 'red', response.status)}`);
    
    if (response.data && typeof response.data === 'object') {
      const stats = response.data;
      console.log(`Total Reminders: ${colorize('yellow', stats.totalReminders || 0)}`);
      console.log(`Pending Reminders: ${colorize('red', stats.pendingReminders || 0)}`);
      console.log(`Completed Reminders: ${colorize('green', stats.completedReminders || 0)}`);
      console.log(`Failed Reminders: ${colorize('red', stats.failedReminders || 0)}`);
      console.log(`Skipped Reminders: ${colorize('yellow', stats.skippedReminders || 0)}`);
      console.log(`Overdue Invoices: ${colorize('red', stats.overdueInvoices || 0)}`);
      console.log(`Total Amount Due: $${colorize('red', stats.totalAmountDue || 0)}`);
    } else {
      console.log(`Response: ${colorize('yellow', JSON.stringify(response.data, null, 2))}`);
    }
    
    console.log('');
    
  } catch (error) {
    log('ERROR', `Failed to fetch reminder stats: ${error.message}`);
  }
}

async function listReminders() {
  log('INFO', 'Fetching reminders list...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/reminders`);
    
    console.log('\n' + colorize('bright', '=== REMINDERS LIST ==='));
    console.log(`HTTP Status: ${colorize(response.status === 200 ? 'green' : 'red', response.status)}`);
    
    if (response.data && response.data.reminders) {
      const reminders = response.data.reminders;
      console.log(`Found ${colorize('yellow', reminders.length)} reminders\n`);
      
      if (reminders.length === 0) {
        log('WARN', 'No reminders found');
      } else {
        reminders.slice(0, 10).forEach((reminder, index) => {
          console.log(`${colorize('cyan', `${index + 1}.`)} Reminder ID: ${colorize('yellow', reminder.id)}`);
          console.log(`   Invoice: ${reminder.invoiceNumber || reminder.invoiceId}`);
          console.log(`   Status: ${colorize('green', reminder.status)}`);
          console.log(`   Scheduled: ${colorize('magenta', reminder.scheduledDate)}`);
          console.log(`   Attempts: ${colorize('yellow', reminder.attemptCount || 0)}`);
          console.log('');
        });
        
        if (reminders.length > 10) {
          console.log(`... and ${colorize('yellow', reminders.length - 10)} more reminders`);
        }
      }
    } else {
      console.log(`Response: ${colorize('yellow', JSON.stringify(response.data, null, 2))}`);
    }
    
    console.log('');
    
  } catch (error) {
    log('ERROR', `Failed to fetch reminders: ${error.message}`);
  }
}

async function getReminderSettings() {
  log('INFO', 'Fetching reminder settings...');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/reminder-settings`);
    
    console.log('\n' + colorize('bright', '=== REMINDER SETTINGS ==='));
    console.log(`HTTP Status: ${colorize(response.status === 200 ? 'green' : 'red', response.status)}`);
    
    if (response.data && typeof response.data === 'object') {
      const settings = response.data;
      console.log(`Max Retry Attempts: ${colorize('yellow', settings.maxRetryAttempts || 'N/A')}`);
      console.log(`Retry Delay Hours: ${colorize('yellow', settings.retryDelayHours || 'N/A')}`);
      console.log(`Call Window Start: ${colorize('cyan', settings.callWindowStart || 'N/A')}`);
      console.log(`Call Window End: ${colorize('cyan', settings.callWindowEnd || 'N/A')}`);
      console.log(`Call Window Timezone: ${settings.callWindowTimezone || 'N/A'}`);
      console.log(`Company Name: ${colorize('magenta', settings.companyName || 'N/A')}`);
      console.log(`Support Phone: ${colorize('magenta', settings.supportPhone || 'N/A')}`);
    } else {
      console.log(`Response: ${colorize('yellow', JSON.stringify(response.data, null, 2))}`);
    }
    
    console.log('');
    
  } catch (error) {
    log('ERROR', `Failed to fetch reminder settings: ${error.message}`);
  }
}

async function testServerConnection() {
  log('INFO', `Testing server connection to ${BASE_URL}...`);
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/reminders/stats`);
    
    if (response.status === 200) {
      log('SUCCESS', 'Server is running and accessible');
      return true;
    } else {
      log('WARN', `Server responded with status ${response.status}`);
      return false;
    }
  } catch (error) {
    log('ERROR', `Cannot connect to server: ${error.message}`);
    log('INFO', 'Make sure your dev server is running with: npm run dev');
    return false;
  }
}

async function runFullTest() {
  console.log(colorize('bright', '='.repeat(60)));
  console.log(colorize('bright', '   Payment Reminder API Test Suite'));
  console.log(colorize('bright', '='.repeat(60)));
  console.log('');
  
  // Test server connection first
  const serverOk = await testServerConnection();
  if (!serverOk) {
    log('ERROR', 'Cannot proceed without server connection');
    return;
  }
  
  console.log('');
  
  // Get initial state
  log('INFO', '=== INITIAL STATE ===');
  await getReminderStats();
  await listReminders();
  
  console.log(colorize('bright', '='.repeat(60)));
  
  // Process reminders
  log('INFO', '=== PROCESSING REMINDERS ===');
  await testReminderProcessing();
  
  console.log(colorize('bright', '='.repeat(60)));
  
  // Get final state
  log('INFO', '=== FINAL STATE ===');
  await getReminderStats();
  
  console.log(colorize('bright', '='.repeat(60)));
  
  // Get settings
  log('INFO', '=== CONFIGURATION ===');
  await getReminderSettings();
  
  console.log(colorize('bright', '='.repeat(60)));
  console.log('');
  log('SUCCESS', 'Test suite completed!');
}

// Command line interface
function showHelp() {
  console.log(colorize('bright', 'Payment Reminder API Test Tool'));
  console.log('');
  console.log('Usage: node test-db-api.js [command] [options]');
  console.log('');
  console.log(colorize('yellow', 'Available Commands:'));
  console.log('  process                    Test reminder processing');
  console.log('  stats                      Get reminder statistics');
  console.log('  list                       List all reminders');
  console.log('  settings                   Get reminder settings');
  console.log('  test                       Run full test suite');
  console.log('  connection                 Test server connection');
  console.log('');
  console.log(colorize('yellow', 'Options:'));
  console.log('  --url=<url>               Base URL (default: http://localhost:3000)');
  console.log('  --help, -h                Show this help');
  console.log('');
  console.log(colorize('yellow', 'Environment Variables:'));
  console.log('  BASE_URL                  Override default base URL');
  console.log('');
  console.log(colorize('yellow', 'Examples:'));
  console.log('  node test-db-api.js test');
  console.log('  node test-db-api.js process');
  console.log('  node test-db-api.js stats');
  console.log('  node test-db-api.js --url=https://your-app.com process');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  // Parse arguments
  let command = 'test';
  let baseUrl = BASE_URL;
  
  args.forEach(arg => {
    if (arg.startsWith('--url=')) {
      baseUrl = arg.substring(6);
    } else if (!arg.startsWith('--')) {
      command = arg;
    }
  });
  
  // Override BASE_URL if provided
  if (baseUrl !== BASE_URL) {
    process.env.BASE_URL = baseUrl;
  }
  
  try {
    switch (command) {
      case 'process':
        await testReminderProcessing();
        break;
        
      case 'stats':
        await getReminderStats();
        break;
        
      case 'list':
        await listReminders();
        break;
        
      case 'settings':
        await getReminderSettings();
        break;
        
      case 'connection':
        await testServerConnection();
        break;
        
      case 'test':
      default:
        await runFullTest();
        break;
    }
  } catch (error) {
    log('ERROR', `Command failed: ${error.message}`);
    console.error(error);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log('ERROR', `Script failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  testReminderProcessing,
  getReminderStats,
  listReminders,
  getReminderSettings,
  testServerConnection,
  runFullTest
};