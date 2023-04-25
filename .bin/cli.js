#!/usr/bin/env node

const rcfile = require('rcfile');

const config = rcfile('docsify-docx-converter.config');

require('../src/index.js')(config);
