const fs = require('fs');
const path = require('path');
const marked = require('marked');
const html2Docx = require('html-docx-js');
const cheerio = require('cheerio');
const sizeOf = require('image-size');
const chalk = require('chalk');
const merge = require('lodash/merge');

const { createHTMLDocument, imgToBase64, blobToBuffer } = require('./utils');

const defaultConfig = {
  /** "table of contents" file path */
  contents: '_sidebar.md',

  /** Whether to enable title degradation, if enabled, replace <h1> with <h2>, <h2> with <h3>, and so on. */
  titleDowngrade: true,

  /** Document root directory */
  rootPath: './docs',

  /**
   * The maximum width of the image in the document, and the height will be adaptive according to the width.
   * The default is 468, which is the maximum width of a word document.
   * */
  imgMaxWidth: 468,

  /**
   * Path where docx will stored
   */
  pathToPublic: './README.docx',

  /** The title of the cover page. */
  coverTitle: null,

  /** The style of the body. */
  bodyStyles: 'font-family: 微软雅黑;',

  /** landscape or portrait (default) */
  orientation: 'portrait',

  /** map of margin sizes
   * expressed in twentieths of point, see WordprocessingML documentation for details):
   * http://officeopenxml.com/WPSectionPgMar.php
   * */
  margins: {}
};

async function run(config) {
  const {
    rootPath,
    titleDowngrade,
    contents,
    imgMaxWidth,
    pathToPublic,
    coverTitle,
    bodyStyles,
    margins,
    orientation
  } = merge(defaultConfig, config);

  console.log(chalk.bold('Build with settings:'));
  console.log(chalk.bgBlue(JSON.stringify(config, null, 2)));
  console.log('\n');

  console.log(chalk.bold('Build markdown files:'));

  try {
    const contentsStr = fs.readFileSync(contents, 'utf8').toString();

    const mdFiles = contentsStr
      .match(/\(([a-zA-Z0-9./_]+)\)/gi)
      ?.map(item => item.match(/\(([a-zA-Z0-9./_]+)\)/)?.[1]);

    const htmlArr = [coverTitle];

    for (let i = 0; i < mdFiles.length; i++) {
      const md = mdFiles[i];
      const html = await mdToHtml({
        filePath: md,
        rootPath,
        titleDowngrade,
        imgMaxWidth
      });

      console.log(`✅ [${i + 1}] ${md}`);

      htmlArr.push(html);
    }

    const html = createHTMLDocument(htmlArr.join('<br/>'), bodyStyles);
    const buffer = await blobToBuffer(
      html2Docx.asBlob(html, { orientation, margins })
    );

    fs.writeFileSync(pathToPublic, buffer);

    console.log(
      '\n',
      chalk.bold.bgGreen(` 😄 SUCCESS: ${pathToPublic} `),
      '\n'
    );
  } catch (e) {
    console.error(e);
  }
}

async function mdToHtml(options) {
  const { rootPath, titleDowngrade, imgMaxWidth, filePath } = options;
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', function (err, file) {
      if (err) {
        reject(err);
        return;
      }

      if (titleDowngrade) {
        file = file.replace(/# /g, '## ');
      }

      const result = marked.parse(file);
      const $ = cheerio.load(result);

      $('img').each((_i, img) => {
        const imgSrc = path
          .resolve(rootPath, decodeURIComponent($(img).attr('src')))
          // Fix the problem of multi-layer nesting of paths caused by direct introduction of <img> tags in the document.
          .replace('docs/docs/assets', 'docs/assets');

        const dimensions = sizeOf(imgSrc);

        if (dimensions.width > imgMaxWidth) {
          $(img).attr('width', imgMaxWidth);
          $(img).attr(
            'height',
            Math.floor((dimensions.height / dimensions.width) * imgMaxWidth)
          );
        }
        $(img).attr('src', imgToBase64(imgSrc));
      });

      $('table').each((_i, table) => {
        $(table).attr('border', 1);
        $(table).attr('cellspacing', 0);
        $(table).attr('cellpadding', 0);
      });

      resolve($.html());
    });
  });
}

module.exports = run;
