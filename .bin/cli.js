#!/usr/bin/env node

const rcfile = require('rcfile');

const config = rcfile('docsifytodocx');

require('../src/index.js')(config);
