import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// 在ES模块中获取当前目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取项目根目录（上一级目录）
const projectRootDir = path.resolve(__dirname, '..');

// 直接使用CommonJS的require来加载psd.js
// 因为有些库在ES模块环境中可能需要特殊处理
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PSD = require('psd.js');

async function convertPsdToPng() {
  try {
    console.log('开始PSD转换...');
    
    // 定义源文件和目标目录，使用项目根目录
    const psdFilePath = path.join(projectRootDir, 'src', 'static', 'logo.psd');
    const iconsDir = path.join(projectRootDir, 'icons');
    const distIconsDir = path.join(projectRootDir, 'dist', 'icons');

    // 确保目标目录存在
    await fs.mkdir(iconsDir, { recursive: true });
    await fs.mkdir(distIconsDir, { recursive: true });
    console.log('目标目录已准备就绪');

    // 使用psd.js的同步API
    console.log('读取并解析PSD文件...');
    const psd = PSD.fromFile(psdFilePath);
    psd.parse();
    console.log('PSD文件解析成功');

    // 保存临时PNG文件
    const tempFilePath = path.join(__dirname, 'temp.png');
    console.log('正在导出PNG到临时文件:', tempFilePath);
    
    // 调用saveAsPng方法，提供文件路径参数
    await psd.image.saveAsPng(tempFilePath);
    console.log('PNG导出成功');
    
    // 验证文件是否存在
    const tempFileExists = await fs.access(tempFilePath).then(() => true).catch(() => false);
    if (!tempFileExists) {
      throw new Error('临时PNG文件创建失败');
    }
    
    // 使用sharp调整图像尺寸
    try {
      const sharp = require('sharp');
      
      // 定义需要转换的尺寸
      const sizes = [16, 32, 64, 128];
      
      for (const size of sizes) {
        const outputPath = path.join(iconsDir, `icon${size}.png`);
        const distOutputPath = path.join(distIconsDir, `icon${size}.png`);

        console.log(`正在生成 ${size}x${size} 尺寸...`);
        await sharp(tempFilePath)
          .resize(size, size)
          .toFile(outputPath);

        // 同时复制到dist目录
        await fs.copyFile(outputPath, distOutputPath);
        console.log(`✅ 已生成 ${outputPath}`);
        console.log(`✅ 已复制到 ${distOutputPath}`);
      }
      
      // 清理临时文件
      await fs.unlink(tempFilePath);
      console.log('✅ PSD转换为PNG完成！');
    } catch (sharpError) {
      console.error('❌ 使用sharp调整尺寸失败:', sharpError);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ PSD转换过程中发生错误:', error);
    process.exit(1);
  }
}

convertPsdToPng();