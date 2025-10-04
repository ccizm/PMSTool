# 酒店PMS工具箱 (HPMS Tool)

![版本](https://img.shields.io/badge/版本-1.25.1003-blue)
![许可证](https://img.shields.io/badge/许可证-Apache--2.0-green)

酒店PMS系统辅助工具，这是您的专属工具箱，让工作更加高效便捷。

## 功能特点

- 🧾 **结账单制作** - 支持多种酒店品牌和模板
- 🔢 **房价计算器** - 快速准确的房价计算工具
- 📚 **常用信息查询** - 国家代码、签证信息等查询
- 📋 **交接班表** - 便捷的班次交接管理
- 🤖 **AI助手** - 智能化工作辅助
- ⏰ **工作提醒** - 自定义提醒功能
- 🌏 **多语言支持** - 支持中文和英文界面

## 技术栈

- Vite
- TailwindCSS
- Chrome Extension Manifest V3
- DayJS
- OpenAI API 集成
- LayUI

## 安装与使用

1. 下载最新版本的扩展程序
2. 在Chrome浏览器中打开 `chrome://extensions/`
3. 开启开发者模式
4. 将下载的扩展程序拖入浏览器或点击"加载已解压的扩展程序"

## 开发指南

### 环境要求

- Node.js (推荐最新LTS版本)
- npm

### 安装依赖

```bash
npm install
```

### 开发命令

```bash
# 清理构建目录
npm run clean

# 转换PSD文件
npm run convert-psd

# 更新版本号
npm run update-version

# 构建项目（不打包）
npm run build-no-zip

# 构建并打包
npm run build
```

### 项目结构

```
src/
├── _locales/          # 多语言支持
├── aiassistant/       # AI助手功能
├── checkout/          # 结账单模块
├── commonInfo/        # 常用信息查询
├── handoversheet/     # 交接班表
├── index/            # 主页面
├── newclock/         # 时钟功能
├── options/          # 设置页面
├── popup/            # 弹出窗口
├── pricecalc/        # 房价计算器
└── static/           # 静态资源
```

## 贡献指南

欢迎提交问题和功能建议！如果您想贡献代码，请：

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m '添加某个功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解更多信息

## 作者

- **Siem** - *初始工作* - [GitHub](https://github.com/pmstool)

## 致谢

感谢所有为这个项目做出贡献的开发者！