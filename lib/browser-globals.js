/*
 * Browser globals setup for Node.js
 * This must be loaded BEFORE any Zotero scripts
 */

const { JSDOM } = require('jsdom');

// Set up browser globals from JSDOM for compatibility
const dom = new JSDOM('', { url: 'http://localhost' });
globalThis.XMLHttpRequest = dom.window.XMLHttpRequest;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.window = dom.window;
