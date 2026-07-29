const { extract } = require('../dist/index.js');

async function run() {
  console.log('🚀 Running extractly basic extraction...\n');

  try {
    // Basic single URL extraction with zero configuration
    const result = await extract('https://example.com');

    console.log('--------------------------------------------------');
    console.log('📌 Title:', result.title);
    console.log('🌐 URL:', result.url);
    console.log('--------------------------------------------------');
    console.log('📄 Extracted Text Content:');
    console.log(result.text);
    console.log('--------------------------------------------------');
    console.log('📊 Execution Stats:', result.stats);
  } catch (error) {
    console.error('❌ Extraction failed:', error);
  }
}

run();
