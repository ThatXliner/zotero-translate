/**
 * Simple example demonstrating the extractMetadata function
 */

const { extractMetadata } = require('./dist/index');

// Simple HTML with embedded metadata
const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Sample Article</title>
  <meta name="citation_title" content="The Impact of Machine Learning on Software Development">
  <meta name="citation_author" content="Smith, John">
  <meta name="citation_author" content="Doe, Jane">
  <meta name="citation_publication_date" content="2024">
  <meta name="citation_journal_title" content="Journal of Software Engineering">
  <meta name="citation_volume" content="42">
  <meta name="citation_issue" content="3">
  <meta name="citation_firstpage" content="123">
  <meta name="citation_lastpage" content="145">
  <meta name="citation_doi" content="10.1234/example.2024.001">
</head>
<body>
  <h1>The Impact of Machine Learning on Software Development</h1>
  <p>Abstract: This paper explores how machine learning is transforming software development...</p>
</body>
</html>
`;

async function main() {
  console.log('Zotero Translate - extractMetadata Example\n');
  console.log('=' .repeat(60));
  
  try {
    console.log('\nExtracting metadata from sample HTML...\n');
    
    const items = await extractMetadata({
      url: 'https://example.com/article/sample',
      html: sampleHtml
    });
    
    console.log(`✓ Found ${items.length} item(s)\n`);
    
    if (items.length > 0) {
      console.log('Extracted metadata:');
      console.log(JSON.stringify(items, null, 2));
    } else {
      console.log('Note: No translators matched this content.');
      console.log('This is expected if translators are not bundled.');
      console.log('Run "npm run download-translators" to bundle translators.');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✓ Example completed successfully');
    
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

main();
