// ohos-postbuild.cjs
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

let unpacked = '';
// 判断架构
if (process.arch === 'x64') {
  unpacked = 'linux-x64-unpacked';
} else if (process.arch === 'arm64') {
  unpacked = 'linux-arm64-unpacked';
} else {
  console.error(`Unsupported architecture: ${process.arch}`);
  process.exit(1);
}
const distDir = path.resolve(__dirname, `../dist_electron/${unpacked}/resources/app/`);
// const targetDir = path.resolve(__dirname, '../src/electron_ohos/web_engine/src/main/resources/resfile/resources/app/');
const targetDir = '/Users/stapxs/Downloads/electron_ohos/web_engine/src/main/resources/resfile/resources/app';

// 将 distDir 中的所有文件复制到 targetDir 中，完全覆盖
function copyDir(src, dest) {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(distDir, targetDir);
console.log('dist 目录已复制到 ohos 资源目录');
