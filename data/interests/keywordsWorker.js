/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

importScripts("tokenizerFactory.js");

function KeywordsWorkerError(message) {
    this.name = "KeywordsWorkerError";
    this.message = message || "KeywordsWorker has errored";
}

function log(msg) {
  dump("-*- keywordsWorker -*- " + msg + '\n')
}

KeywordsWorkerError.prototype = new Error();
KeywordsWorkerError.prototype.constructor = KeywordsWorkerError;

let gNamespace = null;
let gRegionCode = null;
let gTokenizer = null;
let gWordPrefixes = null;
let gNumbersPattern = /\d/

// bootstrap the worker with data and models
function bootstrap(aMessageData) {
  gRegionCode = aMessageData.workerRegionCode;
  gNamespace = aMessageData.workerNamespace;
  gWordPrefixes = aMessageData.wordPrefixes;

  if (aMessageData.urlStopwordSet) {
    gTokenizer = tokenizerFactory.getTokenizer({
      urlStopwordSet: aMessageData.urlStopwordSet,
      regionCode: gRegionCode,
    });
  }

  self.postMessage({
    message: "bootstrapComplete"
  });
}

/**
 * Return whether the validation trie contains the first three
 * letters of a given token.
 */
function _tokenIsValid(token) {
  let currentPosition = gWordPrefixes;
  let isValid = false;
  for (let i=0;  i < token.length; i++) {
    if (currentPosition.hasOwnProperty(token[i])) {
      currentPosition = currentPosition[token[i]];
      if (currentPosition == 0) {
        isValid = true;
        break;
      }
    }
    else {
      break;
    }
  }
  return isValid;
}

// obtain unique keywords from a url and a title
function extractUniqueKeywords({url, title, publicSuffix}) {
  if (gTokenizer == null) {
    return [];
  }

  let tokens = gTokenizer.tokenize(url, title);
  let tokenSet = {};
  for (let token of tokens) {
    if (token.length >= 3 && token.search(gNumbersPattern) == -1 && _tokenIsValid(token)) {
      tokenSet[token] = true;
    }
  }

  // remove public suffix tokens
  if (publicSuffix && publicSuffix != "") {
    let psTokens = gTokenizer.tokenize("", publicSuffix);
    for (let part of psTokens) {
      if (tokenSet[part]) {
        delete tokenSet[part];
      }
    }
  }

  return Object.keys(tokenSet);
}

function getKeywordsForDocument(aMessageData) {
  aMessageData.message = "KeywordsForDocument";
  aMessageData.namespace = gNamespace;

  let results = [];
  try {
    let keywords = extractUniqueKeywords(aMessageData);
    results.push({type: "url_title", keywords: keywords});

    keywords = extractUniqueKeywords({url: "", title: aMessageData.title});
    results.push({type: "title", keywords: keywords});

    aMessageData.results = results;
    self.postMessage(aMessageData);
  }
  catch (ex) {
    log("getKeywordsForDocument: " + ex)
  }
}

// Dispatch the message to the appropriate function
self.onmessage = function({data}) {
  self[data.command](data.payload);
};

