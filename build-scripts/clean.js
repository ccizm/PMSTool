// 清理脚本 - 删除dist和icons目录 (ES模块版本)
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

function cleanDirectories() {
  try {
    console.log('开始清理目录...');
    
    const dirs = ['dist', 'icons'];
    const baseDir = process.cwd();
    
    dirs.forEach(dir => {
      const fullPath = join(baseDir, dir);
      
      if (existsSync(fullPath)) {
        rmSync(fullPath, { recursive: true, force: true });
        console.log(`🗑️  ${dir}目录已清空`);
      } else {
        console.log(`⚠️  ${dir}目录不存在，无需清理`);
      }
    });
    
    console.log('✅ 清理完成！');
  } catch (error) {
    console.error('❌ 清理过程中发生错误:', error);
    process.exit(1);
  }
}

cleanDirectories();