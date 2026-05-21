import { readFileSync, writeFileSync } from 'fs';
const pattern = '.replace(/\\//g, \'\')';
const replacement = '.replace(new RegExp("/","g"), "")';

for (const file of ['src/pages/detail/ArticleDetail.jsx', 'src/pages/detail/GuideDetail.jsx']) {
  const content = readFileSync(file, 'utf8');
  if (content.includes(pattern)) {
    writeFileSync(file, content.split(pattern).join(replacement));
    console.log('Fixed', file);
  } else {
    console.log('Pattern not found in', file);
  }
}
