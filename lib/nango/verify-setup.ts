/**
 * Nango Setup Verification Script
 * 
 * Run this script to verify that Nango is properly configured.
 * Usage: npx tsx lib/nango/verify-setup.ts
 */

import { isNangoConfigured, getNangoClient } from './client';

async function verifySetup() {
  console.log('🔍 Verifying Nango setup...\n');

  // Check 1: Environment variable
  console.log('1. Checking NANGO_SECRET_KEY environment variable...');
  if (isNangoConfigured()) {
    console.log('   ✅ NANGO_SECRET_KEY is configured\n');
  } else {
    console.log('   ❌ NANGO_SECRET_KEY is NOT configured');
    console.log('   → Add NANGO_SECRET_KEY to your .env.local file');
    console.log('   → Get your key from https://nango.dev/dashboard\n');
    process.exit(1);
  }

  // Check 2: Client initialization
  console.log('2. Testing Nango client initialization...');
  try {
    const nango = getNangoClient();
    console.log('   ✅ Nango client initialized successfully\n');
  } catch (error) {
    console.log('   ❌ Failed to initialize Nango client');
    console.log(`   → Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    process.exit(1);
  }

  // Check 3: SDK versions
  console.log('3. Checking installed SDK versions...');
  try {
    const nodePackage = await import('@nangohq/node/package.json');
    const frontendPackage = await import('@nangohq/frontend/package.json');
    
    console.log(`   ✅ @nangohq/node: v${nodePackage.version}`);
    console.log(`   ✅ @nangohq/frontend: v${frontendPackage.version}\n`);
  } catch (error) {
    console.log('   ⚠️  Could not verify SDK versions\n');
  }

  // Summary
  console.log('✨ Nango setup verification complete!');
  console.log('\nNext steps:');
  console.log('1. Create nango-integrations/ folder for integration functions');
  console.log('2. Configure providers in Nango dashboard');
  console.log('3. Deploy integration functions using: pnpm nango deploy dev');
  console.log('\nFor more information, see: lib/nango/README.md\n');
}

// Run verification
verifySetup().catch((error) => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
