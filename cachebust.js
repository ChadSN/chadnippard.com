const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
const cssPath = path.join(__dirname, 'css', 'style.css');
const jsPath = path.join(__dirname, 'js', 'main.js');

const timestamp = Date.now();

let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace(/css\/style\.css(\?v=\d+)?/g, `css/style.css?v=${timestamp}`);
html = html.replace(/js\/main\.js(\?v=\d+)?/g, `js/main.js?v=${timestamp}`);

fs.writeFileSync(htmlPath, html);
console.log('Cache-busting complete!');