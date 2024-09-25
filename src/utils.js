const fs = require('fs');

const createHTMLDocument = (body, bodyStyles) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head><meta charset="UTF-8"> <title></title></head>
      <body style="${bodyStyles}">${body}</body>
    </html>
  `;
};

const imgToBase64 = imgPath => {
  let bitmap = fs.readFileSync(imgPath);
  return (
    'data:image/png;base64,' + Buffer.from(bitmap, 'binary').toString('base64')
  );
};

async function blobToBuffer(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = {
  createHTMLDocument,
  imgToBase64,
  blobToBuffer
};
