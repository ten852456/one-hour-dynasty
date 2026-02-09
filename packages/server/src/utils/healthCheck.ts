/**
 * Database health check utility
 * Can be run independently to verify database connectivity
 */

import { healthCheck, initializeDatabase, getPoolStats } from '../models/database.js';

async function main() {
  console.log('🔍 Checking database connectivity...\n');

  try {
    // Initialize database connection
    await initializeDatabase();
    console.log('✅ Database connection successful\n');

    // Check health
    const isHealthy = await healthCheck();
    if (isHealthy) {
      console.log('✅ Database health check passed\n');
    } else {
      console.log('❌ Database health check failed\n');
      process.exit(1);
    }

    // Get pool statistics
    const stats = getPoolStats();
    console.log('📊 Pool Statistics:');
    console.log(`   Total clients: ${stats.totalCount}`);
    console.log(`   Idle clients: ${stats.idleCount}`);
    console.log(`   Waiting requests: ${stats.waitingCount}\n`);

    console.log('✅ All checks passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  }
}

main();
