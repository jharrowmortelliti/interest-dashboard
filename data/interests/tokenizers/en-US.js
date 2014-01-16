/* -*- Mode: javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 * vim: sw=2 ts=2 sts=2 expandtab
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const kNotWordPattern = /[^a-z0-9 ]+/g;

function Tokenizer({urlStopwordSet, model, rules}) {
  this._urlStopwordSet = urlStopwordSet;
}

Tokenizer.prototype = {
  tokenize: function(aUrl, aTitle, aKeywords) {
    aUrl = aUrl.toLowerCase().replace(kNotWordPattern, " ");

    let tokens = [];

    let urlTokens = aUrl.split(/\s+/);
    urlTokens.forEach(function(token) {
      if (!(this._urlStopwordSet.hasOwnProperty(token))) {
        tokens.push(token);
      }
    }, this);

    aKeywords = aKeywords || '';

    aTitle = (aTitle) ? aTitle.toLowerCase().replace(kNotWordPattern, " ") : "";
    tokens = tokens.concat(aTitle.split(/\s+/));
    tokens = tokens.concat(aKeywords.split(/\s+/));

    return tokens;
  }
};

