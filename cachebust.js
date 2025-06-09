const fs = require('fs');
const path = require('path');

function getAllHtmlFiles(dir, fileList = []) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllHtmlFiles(filePath, fileList);
        } else if (filePath.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const rootDir = __dirname;
const htmlFiles = getAllHtmlFiles(rootDir);

const timestamp = Date.now();

htmlFiles.forEach(htmlPath => {
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace(/css\/style\.css(\?v=\d+)?/g, `css/style.css?v=${timestamp}`);
    html = html.replace(/js\/main\.js(\?v=\d+)?/g, `js/main.js?v=${timestamp}`);
    fs.writeFileSync(htmlPath, html);
    console.log(`Cache-busted: ${htmlPath}`);
});