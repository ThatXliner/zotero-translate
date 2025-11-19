/**
 * Basic smoke test for extractMetadata function
 */

import { extractMetadata } from '../lib/index';

async function testExtractMetadata() {
  console.log('Testing extractMetadata function...');
  
  // Test with a simple HTML page
  const testHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Article</title>
        <meta name="citation_title" content="Test Article Title">
        <meta name="citation_author" content="Doe, John">
        <meta name="citation_publication_date" content="2024">
        <meta name="citation_journal_title" content="Test Journal">
      </head>
      <body>
        <h1>Test Article</h1>
        <p>This is a test article.</p>
      </body>
    </html>
  `;
  
  try {
    const items = await extractMetadata({
      url: 'https://example.com/article',
      html: testHtml
    });
    
    console.log('✓ extractMetadata completed successfully');
    console.log('Found', items.length, 'items');
    
    if (items.length > 0) {
      console.log('First item:', JSON.stringify(items[0], null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('✗ Test failed:', error);
    return false;
  }
}

// Run test
testExtractMetadata()
  .then(success => {
    if (success) {
      console.log('\n✓ All tests passed');
      process.exit(0);
    } else {
      console.log('\n✗ Tests failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
