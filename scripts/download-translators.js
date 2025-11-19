#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO_URL = 'https://www.zotero.org/repo/';
const TRANSLATORS_DIR = path.join(__dirname, '..', 'translators');

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function downloadTranslators() {
  console.log('Fetching translator metadata...');
  const metadata = await fetchJSON(`${REPO_URL}metadata?version=5.0.78`);
  
  console.log(`Found ${metadata.length} translators`);
  
  // Ensure translators directory exists
  if (!fs.existsSync(TRANSLATORS_DIR)) {
    fs.mkdirSync(TRANSLATORS_DIR, { recursive: true });
  }
  
  // Save metadata
  fs.writeFileSync(
    path.join(TRANSLATORS_DIR, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log('Downloading translator code...');
  let count = 0;
  for (const translator of metadata) {
    try {
      const code = await fetchText(`${REPO_URL}code/${translator.translatorID}?version=5.0.78`);
      const filename = `${translator.translatorID}.js`;
      fs.writeFileSync(path.join(TRANSLATORS_DIR, filename), code);
      count++;
      if (count % 50 === 0) {
        console.log(`Downloaded ${count}/${metadata.length} translators...`);
      }
    } catch (e) {
      console.error(`Failed to download ${translator.translatorID}: ${e.message}`);
    }
  }
  
  console.log(`Successfully downloaded ${count} translators`);
}

downloadTranslators().catch(console.error);
