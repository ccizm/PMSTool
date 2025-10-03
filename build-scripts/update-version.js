import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 在ES模块中获取当前目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取项目根目录
const projectRootDir = path.resolve(__dirname, '..');

// 读取package.json
const packageJsonPath = path.join(projectRootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 获取当前版本号
const currentVersion = packageJson.version || '1.0.0.0';

// 获取当前日期
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const datePart = `${String(year).slice(2)}${month}${day}`; // 251003 格式

// 解析当前版本号，提取大版本号
const versionParts = currentVersion.split('.');
let majorVersion = versionParts[0] || '1';

// 生成新的版本号
let newVersion;

// 获取当前的小时和分钟，格式化为时分格式（例如1325表示13点25分）
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const timestamp = hours + minutes;

// 检查当前版本是否包含今天的日期部分
if (versionParts.length >= 3 && versionParts[1] + versionParts[2] === datePart) {
  // 如果是今天的版本，使用当前时分作为修改次数
  newVersion = `${majorVersion}.${versionParts[1]}.${versionParts[2]}.${timestamp}`;
} else {
  // 如果不是今天的版本，创建新版本，使用当前时分作为修改次数
  const yearPart = String(year).slice(2); // 25 格式
  newVersion = `${majorVersion}.${yearPart}${month}${day}.${timestamp}`;
}

// 更新package.json中的版本号
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

console.log(`✅ 版本号已更新为: ${newVersion}`);

// 读取manifest.json并更新版本号
const manifestJsonPath = path.join(projectRootDir, 'src', 'manifest.json');
if (fs.existsSync(manifestJsonPath)) {
  const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8'));
  manifestJson.version = newVersion;
  fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2), 'utf8');
  console.log(`✅ manifest.json版本号已更新为: ${newVersion}`);
}

// 导出新版本号供其他脚本使用
export default newVersion;