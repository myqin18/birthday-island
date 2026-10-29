// 把网站打包成一个可以离线打开的单文件 HTML，作为 NFC / 网络的备用方案。
// 定位：断网也能看的「文字 + 插画 + 猜题彩蛋」版本，不含照片 / 视频 / 3D。
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const read = file => fs.readFileSync(path.join(dir, file), 'utf8');
const dataUri = (file, mime) =>
  `data:${mime};base64,${fs.readFileSync(path.join(dir, file)).toString('base64')}`;

let html = read('index.html');

// 去掉 ?v= 版本号，避免精确匹配失败
const bare = url => url.replace(/\?v=[a-z0-9]+/i, '');

// 按起始标记删除一个闭合的 <div> 块（数深度，避免误删）
function stripDiv(source, startMarker) {
  const at = source.indexOf(startMarker);
  if (at < 0) return source;
  let i = source.indexOf('>', at);
  if (i < 0) return source;
  let depth = 0;
  for (let j = i; j < source.length - 5; j++) {
    if (source.startsWith('<div', j)) depth += 1;
    else if (source.startsWith('</div>', j)) {
      depth -= 1;
      if (depth === 0) return source.slice(0, at) + source.slice(j + 6);
    }
  }
  return source;
}

function stripElement(source, marker) {
  const at = source.indexOf(marker);
  if (at < 0) return source;
  const open = source.indexOf('>', at);
  const close = source.indexOf('</div>', open);
  return source.slice(0, at) + source.slice(close + 6);
}

// ---- 离线不依赖网络的部分：移除媒体与 3D ----
html = stripDiv(html, '<div class="cake-moment">');
html = stripElement(html, '<div id="crystalExperience" class="crystal-experience"');
html = stripElement(html, '<div id="photoGallery" class="photo-gallery"');
html = stripElement(html, '<div id="videoLibrary" class="video-library"');
html = html.replace(/<div class="memory-stats[^>]*>[\s\S]*?<\/div>/g, '');
// 水晶屏留一句说明，避免整屏只剩一个按钮
html = html.replace(
  /(<section class="screen crystal-screen" data-screen="travel">)/,
  '$1\n  <p class="tiny-tip" style="text-align:center;margin:0 0 18px">离线版只保留文字与插画。<br>照片、放映室和水晶梦境需要联网打开。</p>'
);

// ---- 样式内联（含 ?v= 版本号）----
for (const css of ['styles.css', 'gifts.css']) {
  const tag = new RegExp(`<link rel="stylesheet" href="${css}(\\?v=[a-z0-9]+)?">`);
  html = html.replace(tag, `<style>\n${read(css)}\n</style>`);
}
// 离线不需要的样式表：直接删
html = html.replace(/<link rel="stylesheet" href="media\.css(\?v=[a-z0-9]+)?">\s*/g, '');
html = html.replace(/<link rel="stylesheet" href="crystal\.css(\?v=[a-z0-9]+)?">\s*/g, '');

// ---- 脚本内联 ----
for (const js of ['gifts-config.js', 'app.js', 'gifts.js', 'sounds.js', 'celebrate.js']) {
  const tag = new RegExp(`<script src="${js}(\\?v=[a-z0-9]+)?"></script>`);
  // 礼物对照表只写在源码注释里，离线版剥掉注释，避免单文件被直接看出礼物
  const source = js === 'gifts-config.js'
    ? read(js).replace(/^\s*\/\/.*$/gm, '')
    : read(js);
  html = html.replace(tag, `<script>\n${source}\n</script>`);
}
// 离线不需要的脚本：删除
html = html.replace(/<script src="media-config\.js(\?v=[a-z0-9]+)?"><\/script>\s*/g, '');
html = html.replace(/<script src="media\.js(\?v=[a-z0-9]+)?"><\/script>\s*/g, '');
html = html.replace(/<script type="module" src="crystal\.js(\?v=[a-z0-9]+)?"><\/script>\s*/g, '');

// ---- 图片与图标内联 ----
html = html.replace('src="potato-birthday.svg"', `src="${dataUri('potato-birthday.svg', 'image/svg+xml')}"`);
html = html.replace('src="island-map.svg"', `src="${dataUri('island-map.svg', 'image/svg+xml')}"`);
html = html.replace(/<link rel="icon" href="favicon\.svg" type="image\/svg\+xml">/, `<link rel="icon" href="${dataUri('favicon.svg', 'image/svg+xml')}">`);

// ---- 离线环境下不需要的引用 ----
html = html.replace(/<link rel="apple-touch-icon"[^>]*>\s*/g, '');
html = html.replace(/<link rel="manifest"[^>]*>\s*/g, '');
html = html.replace('</head>', '<!-- 离线单文件版：不联网、不需要服务器，直接打开即可 -->\n</head>');
// 记忆卡与音效依赖的数据 URI 里不含外部请求，但视频源必须清掉
html = html.replace(/<video[\s\S]*?<\/video>/g, '');
html = html.replace(/<button id="cakePlay"[\s\S]*?<\/button>/g, '');

const leftovers = html.match(/(?:src|href)="(?!#|data:|https?:)[^"]+"/g) || [];
if (leftovers.length) {
  throw new Error(`仍存在未内联的外部引用：${leftovers.join(', ')}`);
}

const out = path.join(dir, '土豆的生日小岛-离线版.html');
fs.writeFileSync(out, html, 'utf8');

const sizeKb = Math.round(fs.statSync(out).size / 1024);
const checks = {
  标题为十九岁: html.includes('十九岁'),
  内联样式表数量: (html.match(/<style>/g) || []).length,
  内联脚本数量: (html.match(/<script>/g) || []).length,
  土豆插画已内联: html.includes('data:image/svg+xml;base64,'),
  无外部文件引用: leftovers.length === 0,
  对照表注释已剥离: !html.includes('五站与实物礼物的对应'),
  拆开后仍会点名礼物: html.includes('钥匙扣') && html.includes('大白兔'),
  外部链接数量: (html.match(/(?:src|href)="https?:/g) || []).length
};
console.log(JSON.stringify({ 输出文件: path.basename(out), 体积: `${sizeKb} KB`, ...checks }, null, 2));
