const fs = require('fs');
const f = fs.readFileSync('src/pages/detail/ArticleDetail.jsx','utf8');
const fix = f.replace(/\.replace\(\/\\\\\/g,\s*''\)/g, '.replace(new RegExp("/","g"),"")');
fs.writeFileSync('src/pages/detail/ArticleDetail.jsx', fix);
const g = fs.readFileSync('src/pages/detail/GuideDetail.jsx','utf8');
const fix2 = g.replace(/\.replace\(\/\\\\\/g,\s*''\)/g, '.replace(new RegExp("/","g"),"")');
fs.writeFileSync('src/pages/detail/GuideDetail.jsx', fix2);
console.log('Fixed regex in both files');
