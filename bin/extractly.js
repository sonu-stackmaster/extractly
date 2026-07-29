#!/usr/bin/env node

const { extract } = require('../dist/index.js');

async function main() {
  const url = process.argv[2];

  if (!url) {
    console.log('Usage: npx extractly <URL>');
    console.log('Example: npx extractly https://example.com');
    process.exit(1);
  }

  console.log(`\n🔍 Scraping URL with extractly: ${url}\n`);

  try {
    const result = await extract(url);

    console.log('==================================================');
    console.log('📌 Title:', result.title);
    console.log('🌐 Final URL:', result.url);
    console.log('⏱️ Execution Time:', `${result.stats.executionTimeMs}ms`);
    console.log('⚡ Strategy Used:', result.stats.strategyUsed);
    console.log('==================================================\n');

    console.log('📄 Extracted Text Preview (First 500 chars):');
    console.log('--------------------------------------------------');
    console.log(result.text.substring(0, 500) + (result.text.length > 500 ? '...' : ''));
    console.log('--------------------------------------------------\n');

    if (Object.keys(result.metadata).length > 0) {
      console.log('🏷️ Extracted Metadata:');
      console.log(JSON.stringify(result.metadata, null, 2));
    }
  } catch (err) {
    console.error('❌ Extraction failed:', err.message);
  }
}

main();
