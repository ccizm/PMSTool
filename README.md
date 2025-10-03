# PMSTool

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

PMS工具箱是一款专为酒店PMS(PProperty Management System)系统设计的Chrome浏览器扩展，旨在帮助酒店工作人员提高工作效率，简化日常操作流程。该扩展集成了多种实用工具，包括结账单制作、房价计算器、常用信息查询等功能，并内置AI助手提供智能服务。

## 📋 项目简介

PMS工具箱通过整合酒店日常工作中的常用功能，为酒店员工提供一站式解决方案，显著提升工作效率和准确性。无论您是前台接待、财务人员还是管理人员，本工具都能为您的工作带来便利。

## 🚀 核心功能

### 1. 结账单制作
- 快速生成标准酒店结账单
- 支持多种模板选择（Huazhu、iHotel、Sunmei等）
- 自定义消费项目和付款方式
- 一键打印功能

### 2. 房价计算器
- 轻松计算各类房价
- 支持不同会员等级折扣设置
- 自动计算折上折、立减金额和附加金额
- 记录计算历史，方便查阅

### 3. 常用信息查询
- 系统预设常用信息快速查询
- 支持自定义添加常用信息
- 支持Markdown和HTML格式内容
- 支持信息分类管理

### 4. POS差异单
- 生成并打印POS差异单
- 提高财务核对效率
- 支持自定义差异单格式

### 5. 时钟报时器
- 实用的时钟工具
- 支持多种报时方式
- 可设置提醒事项

### 6. AI助手
- 集成智能对话助手
- 支持多种专业场景选择
- 支持流式响应和Markdown格式输出
- 可自定义API设置

### 7. 设置中心
- 全局配置管理
- 酒店信息设置
- 会员等级管理
- 常用信息维护
- AI助手参数配置

## 📁 项目结构

```
PMSTool/
├── build-scripts/         # 构建相关脚本
│   ├── build-zip.js       # 打包压缩脚本
│   ├── clean.js           # 清理构建产物脚本
│   ├── convert-psd.js     # PSD图标自动转换脚本
│   └── update-version.js  # 版本号自动更新脚本
├── src/                   # 源码目录
│   ├── _locales/          # 国际化资源
│   ├── aiassistant/       # AI助手相关页面与脚本
│   ├── checkout/          # 结账单相关页面与脚本
│   ├── commonInfo/        # 常用信息相关页面与脚本
│   ├── handoversheet/     # POS差异单相关页面与脚本
│   ├── index/             # 工作台首页
│   ├── newclock/          # 时钟工具相关页面与脚本
│   ├── options/           # 设置中心相关页面与脚本
│   ├── popup/             # 扩展弹窗
│   ├── pricecalc/         # 房价计算器相关页面与脚本
│   ├── static/            # 静态资源
│   ├── background.js      # 扩展后台脚本
│   ├── content-script.js  # 内容脚本
│   ├── main.js            # 主入口及通用逻辑
│   ├── manifest.json      # Chrome扩展清单
│   ├── reminderUtils.js   # 提醒工具
│   └── style.css          # 全局样式
├── LICENSE                # 许可证
├── package.json           # 项目依赖及脚本
├── postcss.config.js      # PostCSS配置
├── tailwind.config.js     # TailwindCSS配置
├── vite.config.js         # Vite构建配置
└── README.md              # 项目说明
```

## 🛠️ 技术栈

- **前端框架**: 原生JavaScript (ES6+)
- **样式框架**: TailwindCSS
- **构建工具**: Vite
- **扩展开发**: Chrome Extensions API
- **AI集成**: OpenAI API
- **依赖管理**: npm
- **UI组件**: RemixIcon (图标库)
- **时间处理**: dayjs
- **Markdown解析**: marked
- **引导功能**: driver.js

## 📦 安装与使用

### 开发环境安装

1. 克隆项目到本地：
   ```bash
   git clone https://github.com/pmstool/PMSTool.git
   cd PMSTool
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 构建项目：
   ```bash
   npm run build
   ```

4. 在Chrome扩展管理页面（chrome://extensions）加载扩展：
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目中的`src`目录

### 直接使用

1. 下载已构建的扩展包
2. 在Chrome扩展管理页面（chrome://extensions）加载扩展
3. 点击浏览器右上角扩展图标，选择"PMS工具箱"开始使用

## 🚀 构建脚本说明

项目包含多个自动化构建脚本，位于`build-scripts`目录下：

- `clean.js`: 清理构建产物
- `convert-psd.js`: 自动转换PSD文件为图标资源
- `update-version.js`: 自动更新版本号
- `build-zip.js`: 打包扩展为ZIP文件

完整构建命令：
```bash
npm run build
```

## 📖 使用指南

### 工作台
作为扩展的主入口，显示使用统计、快捷工具入口和提醒事项。

### 结账单制作
1. 填写客人基本信息
2. 添加消费账项（可多次添加不同消费类型）
3. 添加付款账项（支持多种付款方式）
4. 选择结账单模板
5. 点击预览并打印

### 房价计算器
1. 选择会员等级
2. 选择日期和房型
3. 输入相关参数（折扣、立减金额等）
4. 点击计算按钮获取结果

### 常用信息查询
1. 从左侧菜单选择要查询的信息分类
2. 点击具体信息项查看详情
3. 可在设置中心添加自定义常用信息

### AI助手
1. 选择专业类型（系统提示词）
2. 在输入框中输入您的问题
3. 点击发送按钮获取AI回复
4. 支持复制AI回复内容

## ⚙️ 配置说明

在设置中心，您可以配置以下内容：

- **酒店信息**: 名称、地址、电话等
- **会员等级**: 添加、编辑、删除会员等级及折扣
- **常用信息**: 管理自定义常用信息
- **AI助手**: 配置API密钥、模型、温度等参数

## 🔐 隐私与安全

- 所有数据存储在本地浏览器中，不会上传到外部服务器
- AI助手功能需要配置API密钥，该密钥仅存储在本地
- 扩展仅请求必要的权限，确保用户数据安全

## 🤝 贡献指南

欢迎提交Issue或Pull Request来帮助改进这个项目。在贡献代码前，请确保：

1. 遵循现有的代码风格
2. 添加适当的注释
3. 测试您的更改

## 📝 许可证

本项目采用Apache 2.0许可证 - 详见[LICENSE](LICENSE)文件

## 📞 联系我们

如有任何问题或建议，请联系项目维护者：
- 邮箱: yan@zhiming.xyz

---

感谢使用PMS工具箱！希望它能为您的酒店工作带来便利和效率。