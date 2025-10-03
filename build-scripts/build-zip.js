import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

// 在ES模块中获取当前目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取项目根目录（上一级目录）
const projectRootDir = path.resolve(__dirname, '..');

// 读取package.json获取项目名称和版本号
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRootDir, 'package.json'), 'utf8'));
const projectName = packageJson.name || 'PMSTools';
const version = packageJson.version || '';

// 构建zip文件名：项目名+版本号+日期
const zipFileName = `${projectName}${version ? '-' + version : ''}.zip`;

// 先在临时位置创建zip文件，避免递归包含
const tempZipPath = path.join(projectRootDir, zipFileName);
const output = fs.createWriteStream(tempZipPath);

// 确保dist目录存在
const outputDir = path.join(projectRootDir, 'dist');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
const archive = archiver('zip', {
  zlib: { level: 9 } // 设置压缩级别
});

// 监听事件
output.on('close', function() {
  // 打包完成后，将临时zip文件移动到dist目录
  const finalZipPath = path.join(outputDir, zipFileName);
  
  // 如果dist目录中已存在同名文件，先删除
  if (fs.existsSync(finalZipPath)) {
    fs.unlinkSync(finalZipPath);
  }
  
  // 移动文件
  fs.renameSync(tempZipPath, finalZipPath);
  
  console.log(`✅ ${archive.pointer()} 字节已写入 ${zipFileName}`);
  console.log(`✅ 打包完成！文件保存在 ${finalZipPath}`);
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

// 管道连接
archive.pipe(output);

// 添加dist目录到zip文件
archive.directory('dist/', false);

// 完成打包
archive.finalize();