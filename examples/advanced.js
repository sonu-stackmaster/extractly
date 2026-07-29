const { extract, extractMany } = require('../dist/index.js');

async function run() {
  console.log('🚀 Running extractly advanced features...\n');

  try {
    // 1. Single URL with custom options (Markdown output + metadata)
    console.log('--- 1. Extracting Markdown & Metadata ---');
    const articleData = await extract('https://quotes.toscrape.com/', {
      mode: 'auto',
      includeMetadata: true,
      timeout: 10000,
    });

    console.log('📌 Title:', articleData.title);
    console.log('📝 Markdown Preview:\n', articleData.markdown.substring(0, 300));
    console.log('🏷️ Metadata:', articleData.metadata);

    // 2. Batch extraction of multiple URLs
    console.log('\n--- 2. Batch Extraction ---');
    const urls = [
      'https://example.com',
      'https://httpbin.org/html'
    ];

    const results = await extractMany(urls, { concurrency: 2 });
    results.forEach((res, idx) => {
      console.log(`\n[Item ${idx + 1}] ${res.url}`);
      console.log(`Title: ${res.title}`);
      console.log(`Word Count: ${res.stats.wordCount} words`);
    });

  } catch (error) {
    console.error('❌ Advanced extraction failed:', error);
  }
}

run();
