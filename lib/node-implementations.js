/*
 * Node.js specific implementations for Zotero Translate
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Enumeration of types of translators
globalThis.TRANSLATOR_TYPES = {"import":1, "export":2, "web":4, "search":8};

globalThis.TRANSLATOR_REQUIRED_PROPERTIES = [
  "translatorID",
  "translatorType",
  "label",
  "creator",
  "target",
  "priority",
  "lastUpdated"
];

globalThis.TRANSLATOR_CACHING_PROPERTIES = globalThis.TRANSLATOR_REQUIRED_PROPERTIES.concat(["browserSupport", "targetAll"]);

/**
 * Node.js implementation of Zotero.HTTP
 */
Zotero.HTTP = Object.assign(Zotero.HTTP || {}, {
  request: async function(method, url, options = {}) {
    options = Object.assign({
      body: null,
      headers: {},
      timeout: 15000,
      responseType: '',
    }, options);
    
    const fetchOptions = {
      method,
      headers: options.headers,
      timeout: options.timeout,
    };
    
    if (options.body && !['GET', 'HEAD'].includes(method)) {
      fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
    
    try {
      const response = await fetch(url, fetchOptions);
      
      // Create XMLHttpRequest-like object for compatibility
      const xmlhttp = {
        status: response.status,
        responseURL: url,
        responseText: await response.text(),
        response: null,
      };
      
      if (options.responseType === 'json') {
        xmlhttp.response = JSON.parse(xmlhttp.responseText);
      } else {
        xmlhttp.response = xmlhttp.responseText;
      }
      
      return xmlhttp;
    } catch (e) {
      throw new Error(`HTTP ${method} ${url} failed: ${e.message}`);
    }
  }
});

/**
 * Node.js implementation of Zotero.Translators
 */
const translatorsDir = path.join(__dirname, '..', 'translators');
const metadataPath = path.join(translatorsDir, 'metadata.json');

Zotero.Translators = Object.assign(Zotero.Translators || {}, {
  _cache: {"import":[], "export":[], "web":[], "search":[]},
  _initialized: false,
  
  init: async function() {
    let translators;
    
    // Try to load from bundled translators first
    if (fs.existsSync(metadataPath)) {
      translators = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    } else {
      // Fallback to remote repository
      translators = await Zotero.Repo.getAllTranslatorMetadata();
    }
    
    this._cache = {"import":[], "export":[], "web":[], "search":[]};
    globalThis._translators = {};
    
    // Build caches
    for(let i=0; i<translators.length; i++) {
      try {
        const translator = new Zotero.Translator(translators[i]);
        globalThis._translators[translator.translatorID] = translator;
        
        for(let type in TRANSLATOR_TYPES) {
          if(translator.translatorType & TRANSLATOR_TYPES[type]) {
            this._cache[type].push(translator);
          }
        }
      } catch(e) {
        Zotero.logError(e);
        try {
          Zotero.logError("Could not load translator "+JSON.stringify(translators[i]));
        } catch(e) {}
      }
    }
    
    // Sort by priority
    const cmp = function (a, b) {
      if (a.priority > b.priority) {
        return 1;
      }
      else if (a.priority < b.priority) {
        return -1;
      }
      return 0;
    }
    for(let type in this._cache) {
      this._cache[type].sort(cmp);
    }
    this._initialized = true;
  },
  
  getCodeForTranslator: async function(translator) {
    if (translator.code) return translator.code;
    
    // Try to load from bundled translators
    const translatorPath = path.join(translatorsDir, `${translator.translatorID}.js`);
    if (fs.existsSync(translatorPath)) {
      translator.code = fs.readFileSync(translatorPath, 'utf-8');
      return translator.code;
    }
    
    // Fallback to repository
    const code = await Zotero.Repo.getTranslatorCode(translator.translatorID);
    translator.code = code;
    return code;
  },
  
  get: async function(id) {
    if (!this._initialized) await this.init();
    const translator = globalThis._translators[id];
    if (!translator) {
      return false;
    }
    
    // only need to get code if it is of some use
    if (translator.runMode === Zotero.Translator.RUN_MODE_IN_BROWSER
        && !translator.hasOwnProperty("code")) {
      translator.code = await this.getCodeForTranslator(translator);
      return translator;
    } else {
      return translator;
    }
  },
  
  getAllForType: async function(type) {
    if(!this._initialized) await this.init();
    const translators = this._cache[type].slice(0);
    const codeGetter = new Zotero.Translators.CodeGetter(translators);
    await codeGetter.getAll();
    return translators;
  }
});

/**
 * Node.js implementation of Zotero.Translate.ItemSaver
 */
Zotero.Translate.ItemSaver.prototype.saveItems = async function(jsonItems) {
  this.items = (this.items || []).concat(jsonItems);
  return jsonItems;
};
