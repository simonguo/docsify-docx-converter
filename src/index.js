const fs = require('fs');
const path = require('path');
const marked = require('marked');
const html2Docx = require('html-docx-js');
const cheerio = require('cheerio');
const sizeOf = require('image-size');
const chalk = require('chalk');
const merge = require('lodash/merge');

const { createHTMLDocument, imgToBase64 } = require('./utils');

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
  pathToPublic: './README.docx'
};

async function run(config) {
  const { rootPath, titleDowngrade, contents, imgMaxWidth, pathToPublic } = merge(
    defaultConfig,
    config
  );

  try {
    const contentsStr = fs.readFileSync(contents, 'utf8').toString();

    const mdFiles = contentsStr
      .match(/\(([a-zA-Z0-9./_]+)\)/gi)
      ?.map(item => item.match(/\(([a-zA-Z0-9./_]+)\)/)?.[1]);

    const htmlArr = [`<h1 style="text-align: center;">${pathToPublic}</h1>`];

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

    fs.writeFileSync(pathToPublic, html2Docx.asBlob(createHTMLDocument(htmlArr.join('<br/>'))));

    console.log('\n', chalk.green(`😄 转换成功: ${pathToPublic}`), '\n');
  } catch (e) {
    console.error(e);
  }
}

function mdToHtml(options) {
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
          $(img).attr('height', Math.floor((dimensions.height / dimensions.width) * imgMaxWidth));
        }

        $(img).attr('src', imgToBase64(imgSrc));
      });

      resolve($.html());
    });
  });
}

module.exports = run;
