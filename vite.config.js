import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.json'
import copy from 'rollup-plugin-copy'
import pkg from './package.json'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  // 缓存配置
  cacheDir: '.vite-temp', // 指定开发模式的缓存目录，避免在dist中生成
  plugins: [
    // 从package.json更新manifest版本号和其他元数据
    crx({
      manifest: {
        ...manifest,
        name: pkg.displayName || pkg.name,
        version: pkg.version,
        description: pkg.description,
        author: pkg.author
      }
    }),
    copy({
      targets: [{
        src: 'src/commonInfo/data',
        dest: 'dist/src/commonInfo'
      },
      {
        src: 'node_modules/layui-laydate/src/theme/**/*',
        dest: 'dist/assets/theme'
      },
      {
        src: 'src/_locales',
        dest: 'dist'
      }
      ],
      hook: 'writeBundle',
      verbose: true
    }),
    // 自定义插件清理dist/.vite目录
    {
      name: 'clean-vite-dir',
      closeBundle() {
        const viteDir = path.resolve(__dirname, 'dist/.vite')
        if (fs.existsSync(viteDir)) {
          fs.rmSync(viteDir, { recursive: true, force: true })
          console.log('Removed dist/.vite directory')
        }
      }
    }
  ],
  build: {
    // 禁止生成.vite目录相关配置
    manifest: false,
    ssrManifest: false,
    modulePreload: {
      polyfill: false
    },
    rollupOptions: {
      input: {
        popup: 'src/popup/popup.html',
        index: 'src/index/index.html',
        checkout: 'src/checkout/checkout.html',
        options: 'src/options/options.html',
        handoversheet: 'src/handoversheet/handoversheet.html',
        handoverPrint: 'src/handoversheet/handoverPrint/handoverPrint.html',
        pricecalc: 'src/pricecalc/pricecalc.html',
        commonInfo: 'src/commonInfo/commonInfo.html',
        aiassistant: 'src/aiassistant/aiassistant.html',
        newclock: 'src/newclock/newclock.html',
        // 模板文件 - 添加为入口点确保它们被编译
        huazhuPrint1: 'src/checkout/Template/Huazhu/Print1/index.html',
        huazhuPrint2: 'src/checkout/Template/Huazhu/Print2/index.html',
        ihotelMoments: 'src/checkout/Template/iHotel/Moments/index.html',
        sunmeiPrint1: 'src/checkout/Template/Sunmei/Print1/index.html'
      },
      // 配置输出选项
      output: {
        manualChunks: undefined,
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // 禁用生成构建元数据
        generatedCode: {
          preset: 'es2015',
          constBindings: true
        }
      }
    },
    // 禁用开发工具
    devtools: false,
    // 禁用sourcemap
    sourcemap: false,
    // 禁用动态导入
    dynamicImportVarsOptions: {
      warnOnError: false
    }
  },
  // 优化配置
  optimizeDeps: {
    // 禁用预构建缓存
    cacheDir: '.vite-temp/optimize-cache',
    // 禁用生成manifest
    generateManifest: false
  },
})
