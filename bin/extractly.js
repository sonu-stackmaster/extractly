#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { extract } = require('../dist/index.js');
const { parseCookies } = require('../dist/index.js'); // Or helper

async function main() {
  const args = process.argv.slice(2);
  let url = '';
  let cookieInput = '';
  let cookieFilePath = '';
  let mode = 'auto';
  const customHeaders = {};

  for (const arg of args) {
    if (arg.startsWith('--cookie=')) {
      cookieInput = arg.replace('--cookie=', '').trim();
    } else if (arg.startsWith('--cookie-file=')) {
      cookieFilePath = arg.replace('--cookie-file=', '').trim();
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
    console.log('Usage: node bin/extractly.js <URL> [options]\n');
    console.log('Options:');
    console.log('  --cookie="li_at=..."               Pass cookie string or tab-separated DevTools table');
    console.log('  --cookie-file=cookies.txt          Load cookies from file (JSON, Netscape, DevTools table)');
    console.log('  --header="Key: Value"              Pass custom HTTP header');
    console.log('  --mode=auto|fast|stealth|browser   Set extraction strategy mode\n');
    console.log('Examples:');
    console.log('  node bin/extractly.js https://example.com');
    console.log('  node bin/extractly.js https://www.linkedin.com/in/sk0611/ --cookie-file=cookies.txt');
    process.exit(1);
  }

  if (cookieFilePath) {
    try {
      const resolvedPath = path.resolve(process.cwd(), cookieFilePath);
      if (fs.existsSync(resolvedPath)) {
        cookieInput = fs.readFileSync(resolvedPath, 'utf8');
        console.log(`🔑 Loaded cookie file: ${resolvedPath}`);
      } else {
        console.warn(`⚠️ Cookie file not found: ${cookieFilePath}`);
      }
    } catch (e) {
      console.warn(`⚠️ Error reading cookie file: ${e.message}`);
    }
  }

  let parsedCookies;
  if (cookieInput) {
    try {
      const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      const { parseCookies } = require('../dist/index.js');
      if (typeof parseCookies === 'function') {
        parsedCookies = parseCookies(cookieInput, host);
        if (parsedCookies && parsedCookies.length > 0) {
          const cookieHeaderVal = parsedCookies.map((c) => `${c.name}=${c.value}`).join('; ');
          customHeaders['Cookie'] = cookieHeaderVal;
          console.log(`✅ Parsed ${parsedCookies.length} valid cookies for ${host}`);
        }
      }
    } catch (e) {
      // Fallback
      customHeaders['Cookie'] = cookieInput.replace(/[\r\n\t]/g, ' ').trim();
    }
  }

  console.log(`\n🔍 Scraping URL with extractly: ${url}\n`);

  try {
    const result = await extract(url, {
      mode,
      cookies: parsedCookies,
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
