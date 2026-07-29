#!/usr/bin/env node

const { extract } = require('../dist/index.js');

async function main() {
  const args = process.argv.slice(2);
  let url = '';
  let cookieHeader = '';
  let mode = 'auto';
  const customHeaders = {};

  for (const arg of args) {
    if (arg.startsWith('--cookie=')) {
      cookieHeader = arg.replace('--cookie=', '').trim();
    } else if (arg.startsWith('--header=')) {
      const headerStr = arg.replace('--header=', '').trim();
      const parts = headerStr.split(':');
      if (parts.length >= 2) {
        customHeaders[parts[0].trim()] = parts.slice(1).join(':').trim();
      }
    } else if (arg.startsWith('--mode=')) {
      mode = arg.replace('--mode=', '').trim();
    } else if (!url && !arg.startsWith('--')) {
      url = arg;
    }
  }

  if (!url) {
    console.log('Usage: node bin/extractly.js <URL> [options]');
    console.log('Options:');
    console.log('  --cookie="li_at=YOUR_COOKIE_VALUE"  Pass session cookie');
    console.log('  --header="Key: Value"               Pass custom HTTP header');
    console.log('  --mode=auto|fast|stealth|browser    Set extraction mode\n');
    console.log('Example: node bin/extractly.js https://www.linkedin.com/in/sk0611/ --cookie="li_at=xyz"');
    process.exit(1);
  }

  if (cookieHeader) {
    customHeaders['Cookie'] = cookieHeader;
  }

  console.log(`\n🔍 Scraping URL with extractly: ${url}\n`);

  try {
    const result = await extract(url, {
      mode,
      headers: Object.keys(customHeaders).length > 0 ? customHeaders : undefined,
    });

    console.log('==================================================');
    console.log('📌 Title:', result.title);
    console.log('🌐 Final URL:', result.url);
    console.log('⏱️ Execution Time:', `${result.stats.executionTimeMs}ms`);
    console.log('⚡ Strategy Used:', result.stats.strategyUsed);
    console.log('📊 Total Characters:', result.stats.contentLength);
    console.log('📝 Total Words:', result.stats.wordCount);
    console.log('==================================================\n');

    console.log('📄 Full Extracted Text Content:');
    console.log('--------------------------------------------------');
    console.log(result.text);
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
