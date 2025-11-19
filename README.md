# Zotero Translate

A standalone npm TypeScript library that provides metadata extraction from web pages using Zotero translators.

## Installation

```bash
npm install zotero-translate
```

## Usage

The library exports a single `extractMetadata` function that takes a URL (and optionally HTML content) and returns Zotero metadata items.

### Basic Example

```typescript
import { extractMetadata } from 'zotero-translate';

// Extract metadata from a URL
const items = await extractMetadata({
  url: 'https://arxiv.org/abs/2301.00000'
});

console.log(items);
// [
//   {
//     itemType: 'journalArticle',
//     title: 'Article Title',
//     creators: [{ firstName: 'John', lastName: 'Doe', creatorType: 'author' }],
//     ...
//   }
// ]
```

### With Custom HTML

If you already have the HTML content, you can provide it to avoid an extra HTTP request:

```typescript
import { extractMetadata } from 'zotero-translate';
import fetch from 'node-fetch';

const response = await fetch('https://arxiv.org/abs/2301.00000');
const html = await response.text();

const items = await extractMetadata({
  url: 'https://arxiv.org/abs/2301.00000',
  html
});
```

## API

### `extractMetadata(options: ExtractMetadataOptions): Promise<ZoteroItem[]>`

Extracts metadata from a web page using Zotero translators.

#### Parameters

- `options.url` (string, required): The URL of the page to extract metadata from
- `options.html` (string, optional): The HTML content of the page. If not provided, it will be fetched from the URL

#### Returns

Returns a Promise that resolves to an array of `ZoteroItem` objects. Each item contains:

- `itemType`: The type of the item (e.g., 'journalArticle', 'book', 'webpage')
- `title`: The title of the item
- `creators`: Array of creator objects with fields like `firstName`, `lastName`, `creatorType`
- Additional fields depending on the item type (e.g., `DOI`, `publicationTitle`, `date`, etc.)

Returns an empty array if no translators are available for the given page.

## Translators

This library bundles Zotero translators for metadata extraction. The translators are automatically updated via GitHub Actions.

### Manual Translator Update

To manually download the latest translators:

```bash
npm run download-translators
```

## Development

### Building

```bash
npm install
npm run build
```

### Running Tests

```bash
npm test
```

## Architecture

This repository contains the Zotero translation architecture code responsible for 
parsing Zotero translators and running them on live and static web pages to retrieve
Zotero items.

The library:
1. Loads the Zotero translation engine and utilities
2. Initializes translators from the bundled repository
3. Parses HTML content with JSDOM
4. Runs appropriate translators to extract metadata
5. Returns structured Zotero item data

## Browser Example

For a browser-based example, see the `example/` directory. To run it:

```bash
git submodule update --init
google-chrome --disable-web-security --user-data-dir=/tmp/chromeTemp example/index.html
```

## License

This project is licensed under the GNU Affero General Public License v3.0 - see the [COPYING](COPYING) file for details.

## Credits

Based on the [Zotero](https://www.zotero.org/) translation architecture.

Copyright © 2009-2021 Center for History and New Media, George Mason University, Fairfax, Virginia, USA  
http://zotero.org
