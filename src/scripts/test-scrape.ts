// src/scripts/test-scrape.ts
import { searchFirms } from '../lib/scraper';
import * as fs from 'fs/promises';
import path from 'path';

async function testScrape() {
  console.log('🚀 Testing LPPEH scraper with one state...\n');
  
  try {
    // Create directories
    const dataDir = path.join(process.cwd(), 'data');
    const debugDir = path.join(process.cwd(), 'debug');
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(debugDir, { recursive: true });
    
    // Test with Selangor
    const state = 'SELANGOR';
    console.log(`🔍 Scraping ${state} firms...`);
    
    // Scrape the data
    const firms = await searchFirms(state);
    
    // Save results
    const testPath = path.join(dataDir, 'test-results.json');
    await fs.writeFile(
      testPath,
      JSON.stringify({
        firms,
        timestamp: new Date().toISOString(),
        state,
        meta: {
          totalFirms: firms.length,
          debugFiles: await fs.readdir(debugDir)
        }
      }, null, 2)
    );
    
    console.log(`\n✨ Test completed successfully!
    • Firms found: ${firms.length}
    • Data saved to: ${testPath}
    • Debug files saved in: ${debugDir}
    `);
    
    if (firms.length === 0) {
      console.log('\n⚠️  Warning: No firms were found. Check the debug files for the HTML response.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testScrape().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});