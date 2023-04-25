# docsify-docx-converter

📖 A tool for building docx based on your docsify project

## Install

```
npm install --save-dev docsify-docx-converter

```

## Usage

Create config file `docsify-docx-converter.config.js` in your project root directory.

```js
module.exports = {
  /** "table of contents" file path */
  contents: '_sidebar.md',

  /** Whether to enable title degradation, if enabled, replace <h1> with <h2>, <h2> with <h3>, and so on. */
  titleDowngrade: true,

  /** Document root directory */
  rootPath: './docs',

  /** Path where docx will stored */
  pathToPublic: './README.docx',

  /**
   * The maximum width of the image in the document, and the height will be adaptive according to the width.
   * The default is 468, which is the maximum width of a word document.
   */
  imgMaxWidth: 468
};
```

Add script into package.json:

```
{
  "scripts": {
    "convert": "node_modules/.bin/docsify-docx-converter"
  }
}
```

Run converter:

```
npm run convert

```
