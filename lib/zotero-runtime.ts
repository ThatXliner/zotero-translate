/**
 * Zotero Runtime Initialization
 * This module sets up the Zotero environment for Node.js
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import fetch from 'node-fetch';

// Type declarations for Zotero globals
declare global {
  var Zotero: any;
  var ZOTERO_CONFIG: any;
  var TRANSLATOR_TYPES: any;
  var TRANSLATOR_REQUIRED_PROPERTIES: any;
  var TRANSLATOR_CACHING_PROPERTIES: any;
  var _translators: any;
}

let zoteroInitialized = false;

/**
 * Load and execute a JavaScript file in the global context
 */
function loadScript(filepath: string): void {
  let code = fs.readFileSync(filepath, 'utf-8');
  
  // Replace const/let declarations of key variables with global assignments
  // This ensures they become truly global
  code = code.replace(/^(const|let) (ZOTERO_CONFIG|TRANSLATOR_TYPES|TRANSLATOR_REQUIRED_PROPERTIES|TRANSLATOR_CACHING_PROPERTIES)\s*=/gm, 
    (match, keyword, varName) => `globalThis.${varName} =`);
  
  // Temporarily hide module/require/process to force browser code path
  const savedModule = (global as any).module;
  const savedRequire = (global as any).require;
  const savedProcess = (global as any).process;
  delete (global as any).module;
  delete (global as any).require;
  delete (global as any).process;
  
  try {
    // Use indirect eval to execute in global scope
    // This is equivalent to browser script tags
    (0, eval)(code);
  } finally {
    // Restore module/require/process
    if (savedModule !== undefined) {
      (global as any).module = savedModule;
    }
    if (savedRequire !== undefined) {
      (global as any).require = savedRequire;
    }
    if (savedProcess !== undefined) {
      (global as any).process = savedProcess;
    }
  }
}

/**
 * Load a Node.js specific script that needs require/module
 */
function loadNodeScript(filepath: string): void {
  const code = fs.readFileSync(filepath, 'utf-8');
  // Use direct eval to execute in this function's scope where require is available
  eval(code);
}

/**
 * Initialize the Zotero translation environment
 */
export async function initializeZotero(): Promise<any> {
  if (zoteroInitialized && global.Zotero) {
    return global.Zotero;
  }
  
  const srcDir = path.join(__dirname, '..', 'src');
  const modulesDir = path.join(__dirname, '..', 'modules', 'utilities');
  const exampleDir = path.join(__dirname, '..', 'example');
  
  // Load browser globals FIRST
  loadNodeScript(path.join(__dirname, '..', 'lib', 'browser-globals.js'));
  
  // Load Zotero core files in order
  loadScript(path.join(srcDir, 'zotero.js'));
  loadScript(path.join(srcDir, 'promise.js'));
  
  // Load utilities
  loadScript(path.join(modulesDir, 'openurl.js'));
  loadScript(path.join(modulesDir, 'date.js'));
  loadScript(path.join(modulesDir, 'xregexp-all.js'));
  loadScript(path.join(modulesDir, 'xregexp-unicode-zotero.js'));
  loadScript(path.join(modulesDir, 'utilities.js'));
  loadScript(path.join(modulesDir, 'utilities_item.js'));
  loadScript(path.join(modulesDir, 'schema.js'));
  loadScript(path.join(modulesDir, 'resource', 'zoteroTypeSchemaData.js'));
  loadScript(path.join(modulesDir, 'cachedTypes.js'));
  
  loadScript(path.join(srcDir, 'utilities_translate.js'));
  loadScript(path.join(srcDir, 'debug.js'));
  // Load base translators first, then example implementation
  loadScript(path.join(srcDir, 'translators.js'));
  // Use example/http.js, translators.js and translate_item.js which have the real implementations
  loadScript(path.join(exampleDir, 'http.js'));
  loadScript(path.join(srcDir, 'translator.js'));
  loadScript(path.join(exampleDir, 'translators.js'));
  loadScript(path.join(srcDir, 'repo.js'));
  
  // Load translation modules
  const translationDir = path.join(srcDir, 'translation');
  loadScript(path.join(translationDir, 'translate.js'));
  loadScript(path.join(translationDir, 'sandboxManager.js'));
  loadScript(path.join(translationDir, 'translate_item.js'));
  loadScript(path.join(exampleDir, 'translate_item.js'));
  
  loadScript(path.join(srcDir, 'tlds.js'));
  loadScript(path.join(srcDir, 'proxy.js'));
  
  // Load RDF
  const rdfDir = path.join(srcDir, 'rdf');
  loadScript(path.join(rdfDir, 'init.js'));
  loadScript(path.join(rdfDir, 'uri.js'));
  loadScript(path.join(rdfDir, 'term.js'));
  loadScript(path.join(rdfDir, 'identity.js'));
  loadScript(path.join(rdfDir, 'n3parser.js'));
  loadScript(path.join(rdfDir, 'rdfparser.js'));
  loadScript(path.join(rdfDir, 'serialize.js'));
  
  // Load Node.js specific implementations (for Zotero.Translators)
  loadNodeScript(path.join(__dirname, '..', 'lib', 'node-implementations.js'));
  
  // Initialize schema (skip if network is unavailable)
  try {
    const schemaResponse = await fetch('https://api.zotero.org/schema');
    const schemaData = await schemaResponse.json();
    global.Zotero.Schema.init(schemaData);
  } catch (e) {
    console.warn('Warning: Could not fetch Zotero schema, some features may not work correctly');
    // Initialize with minimal schema that has the required structure
    global.Zotero.Schema.init({ 
      version: 0, 
      itemTypes: [], 
      fields: [], 
      creatorTypes: [],
      csl: {
        types: {},
        fields: { text: {}, date: {} },
        names: {}
      }
    });
  }
  
  // Initialize date formats
  const dateFormatsPath = path.join(modulesDir, 'resource', 'dateFormats.json');
  const dateFormats = JSON.parse(fs.readFileSync(dateFormatsPath, 'utf-8'));
  try {
    global.Zotero.Date.init(dateFormats);
  } catch (e) {
    console.error('Error initializing Zotero.Date:', e);
    throw e;
  }
  
  // Initialize debug logging
  global.Zotero.Debug.init(1);
  
  // Initialize translators
  await global.Zotero.Translators.init();
  
  zoteroInitialized = true;
  return global.Zotero;
}
