import './style.css'

// 修复导入路径，使用相对路径格式
import '../node_modules/layui-laydate/dist/laydate.js'

// 导航链接数据 - 集中管理以便动态生成
export const navbarLinks = {
  main: [
    { id: 'index', name: '工作台', url: '/src/index/index.html' },
    // 将四个页面分类到工具下
    {
      id: 'tools',
      name: '工具',
      isDropdown: true,
      sublinks: [
        { id: 'checkout', name: '结账单制作', url: '/src/checkout/checkout.html' },
        { id: 'pricecalc', name: '房价计算器', url: '/src/pricecalc/pricecalc.html' },
        { id: 'commonInfo', name: '查常用信息', url: '/src/commonInfo/commonInfo.html' },
        { id: 'handoversheet', name: 'POS差异单', url: '/src/handoversheet/handoversheet.html' },
        { id: 'newclock', name: '时钟报时器', url: '/src/newclock/newclock.html' }
      ]
    },
    { id: 'aiassistant', name: 'AI助手', url: '/src/aiassistant/aiassistant.html' },
    { id: 'options', name: '设置', url: '/src/options/options.html' }
  ]
};

// 获取导航链接数据
export function getNavbarLinks() {
  return navbarLinks;
}

/**
 * 创建统一的导航栏
 */
export function createNavbar() {
  // 检查是否已存在导航栏容器
  let navbarContainer = document.getElementById('navbar-container');
  if (!navbarContainer) {
    // 创建导航栏容器
    navbarContainer = document.createElement('div');
    navbarContainer.id = 'navbar-container';

    // 插入到body的最前面
    document.body.insertBefore(navbarContainer, document.body.firstChild);
  }

  // 获取当前页面URL以确定活动链接
  const currentUrl = window.location.pathname;

  // 创建导航栏HTML
  navbarContainer.innerHTML = `
    <nav class="bg-white shadow-sm">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center py-3">
          <div class="flex items-center">
            <a href="/src/index/index.html" class="flex items-center">
              <img src="/icons/icon32.png" alt="PMS工具箱" class="h-8 w-8 mr-2">
              <span class="text-xl font-bold text-blue-600">PMS工具箱</span>
            </a>
          </div>
          
          <div class="hidden md:flex space-x-6">
            ${navbarLinks.main.map(link => {
    // 检查是否是下拉菜单
    if (link.isDropdown) {
      // 检查下拉菜单中是否有当前活动链接
      const hasActiveSublink = link.sublinks.some(sublink => currentUrl.includes(sublink.id));

      return `
                  <div class="relative desktop-dropdown">
                    <button class="desktop-dropdown-button ${hasActiveSublink ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'} flex items-center space-x-1">
                      ${link.name}
                      <i class="ri-arrow-down-s-line text-sm desktop-dropdown-icon"></i>
                    </button>
                    <div class="desktop-dropdown-menu absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden z-10">
                      ${link.sublinks.map(sublink => `
                        <a 
                          href="${sublink.url}"
                          class="${currentUrl.includes(sublink.id) ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'} block px-4 py-2 text-sm"
                        >
                          ${sublink.name}
                        </a>
                      `).join('')}
                    </div>
                  </div>
                `;
    } else {
      // 普通导航链接
      return `
                  <a 
                    href="${link.url}"
                    class="${currentUrl.includes(link.id) ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'} flex items-center py-3"
                  >
                    ${link.name}
                  </a>
                `;
    }
  }).join('')}
          </div>
          
          <!-- 移动端菜单按钮 -->
          <div class="md:hidden">
            <button id="mobile-menu-button" class="text-gray-600 focus:outline-none">
              <i class="ri-menu-line text-lg"></i>
            </button>
          </div>
        </div>
        
        <!-- 移动端导航菜单 -->
        <div id="mobile-menu" class="md:hidden hidden pb-3">
          <div class="flex flex-col space-y-2">
            ${navbarLinks.main.map(link => {
    // 检查是否是下拉菜单
    if (link.isDropdown) {
      return `
                  <div class="mobile-dropdown">
                    <button class="w-full text-left ${link.sublinks.some(sublink => currentUrl.includes(sublink.id)) ? 'text-blue-600 font-medium' : 'text-gray-600'} px-4 py-2 flex justify-between items-center">
                      ${link.name}
                      <i class="ri-arrow-down-s-line text-sm mobile-dropdown-icon"></i>
                    </button>
                    <div class="mobile-dropdown-menu hidden pl-8 space-y-1">
                      ${link.sublinks.map(sublink => `
                        <a 
                          href="${sublink.url}"
                          class="${currentUrl.includes(sublink.id) ? 'text-blue-600 font-medium' : 'text-gray-600'} block px-4 py-2"
                        >
                          ${sublink.name}
                        </a>
                      `).join('')}
                    </div>
                  </div>
                `;
    } else {
      // 普通导航链接
      return `
                  <a 
                    href="${link.url}"
                    class="${currentUrl.includes(link.id) ? 'text-blue-600 font-medium' : 'text-gray-600'} px-4 py-2"
                  >
                    ${link.name}
                  </a>
                `;
    }
  }).join('')}
          </div>
        </div>
      </div>
    </nav>
  `;

  // 添加移动端菜单切换事件
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // 添加移动端下拉菜单切换事件
  const mobileDropdowns = document.querySelectorAll('.mobile-dropdown');
  mobileDropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('button');
    const menu = dropdown.querySelector('.mobile-dropdown-menu');
    const icon = dropdown.querySelector('.mobile-dropdown-icon');

    if (button && menu && icon) {
      button.addEventListener('click', () => {
        menu.classList.toggle('hidden');
        // 切换图标旋转状态
        icon.style.transform = menu.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
      });
    }
  });

  // 添加桌面端下拉菜单点击触发事件
  const desktopDropdowns = document.querySelectorAll('.desktop-dropdown');
  desktopDropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('.desktop-dropdown-button');
    const menu = dropdown.querySelector('.desktop-dropdown-menu');
    const icon = dropdown.querySelector('.desktop-dropdown-icon');

    if (button && menu && icon) {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        menu.classList.toggle('hidden');
        // 切换图标旋转状态
        icon.style.transform = menu.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
      });

      // 添加菜单内点击事件，防止点击菜单项时关闭菜单
      menu.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  });

  // 点击页面其他地方关闭所有下拉菜单
  document.addEventListener('click', () => {
    // 关闭桌面端下拉菜单
    document.querySelectorAll('.desktop-dropdown-menu').forEach(menu => {
      if (!menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        // 重置图标旋转状态
        const icon = menu.parentElement.querySelector('.desktop-dropdown-icon');
        if (icon) {
          icon.style.transform = 'rotate(0deg)';
        }
      }
    });

    // 关闭移动端下拉菜单（如果需要）
    document.querySelectorAll('.mobile-dropdown-menu').forEach(menu => {
      if (!menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        // 重置图标旋转状态
        const icon = menu.parentElement.querySelector('.mobile-dropdown-icon');
        if (icon) {
          icon.style.transform = 'rotate(0deg)';
        }
      }
    });
  });
}

/**
 * 页面标题配置映射
 */
export const pageTitles = {
  'index': '工作台 - PMS工具箱',
  'checkout': '结账单制作 - PMS工具箱',
  'pricecalc': '房价计算器 - PMS工具箱',
  'commonInfo': '查常用信息 - PMS工具箱',
  'handoversheet': 'POS差异单 - PMS工具箱',
  'handoverPrint': 'POS差异单打印 - PMS工具箱',
  'aiassistant': 'AI助手 - PMS工具箱',
  'options': '设置 - PMS工具箱',
  'popup': 'PMS工具箱',
  'clock': '时钟工具 - PMS工具箱'
};


/**
 * 设置页面标题
 * 根据当前URL设置对应的页面标题
 */
export function setPageTitle() {
  const currentUrl = window.location.pathname;

  // 遍历页面标题配置，找到匹配的页面ID
  for (const [pageId, title] of Object.entries(pageTitles)) {
    if (currentUrl.includes(pageId)) {
      document.title = title;
      return;
    }
  }

  // 如果没有找到匹配的页面ID，使用默认标题
  document.title = 'PMS工具箱';
}

// 全局变量
export let appOptions = {}

// 默认初始化信息 - 在用户设置前提供初始数据
export const options = {
  "Hotel": [{
    "HotelName": "橙子上海徐家汇虚拟酒店",
    "HotelAddress": "上海市徐汇区橙子江路",
    "HotelPhone": "021-12345678",
    "HotelNumber": "2152003",
    "HotelZip": "123456",
    "HotelFax": "12345678"
  }],
  "Staff": [{
    "StaffName": "默认用户"
  }],
  "Payment": [
    "支付宝",
    "微信",
    "京东支付",
    "现金",
    "芝麻信用",
    "AR账",
    "挂账",
    "Unipay 银联卡",
    "信用卡",
    "度小满",
    "储值卡",
    "汇票",
    "支票",
    "预授权",
    "数字人民币"
  ],
  "Consumption": [
    "房费",
    "早餐",
    "餐饮",
    "损毁费",
    "商品",
    "税金",
    "租赁费",
    "会议费",
    "其他"
  ],
  "Vip": [{
    "VipType": "星会员",
    "VipDiscount": "98"
  },
  {
    "VipType": "银会员",
    "VipDiscount": "92"
  },
  {
    "VipType": "金会员",
    "VipDiscount": "88"
  },
  {
    "VipType": "铂金会员",
    "VipDiscount": "85"
  }
  ],
  "CommonInfo": []
};

export const Checkout = {
  "CustomNum": "1",
  "RoomNum": "1",
  "CustomerName": "一个数据库例子",
  "CheckinTime": "2019-01-01",
  "CheckoutTime": "2019-01-02",
  "PrintDate": "2017-01-01",
  "StaffAD": "21",
  "CheckoutData": [{
    "Consumption": [{
      "ConsumptionDate": "01.01.2019",
      "ConsumptionType": "Food",
      "ConsumptionRoom": "Kitchen",
      "ConsumptionAmount": "2"
    }],
    "ConsumptionTotal": "2",
    "Payment": [{
      "PaymentDate": "01.01.2019",
      "PaymentType": "Cash",
      "PaymentAmount": "100"
    }],
    "PaymentTotal": "100",
  }]
};

export const PriceCalc = {
  "PriceCalcItem": [{
    "VipType": "铂金会员",
    "VipDiscount": "85",
    "date": "2019-01-01",
    "Price": "-",
    "RetailPrice": "-",
    "FoldOnFold": "-",
    "Minus": "-",
    "Add": "-"
  }]
};

export const HandoverSheet = {
  "Sheet": [{
    "HotelName": "",
    "date": "",
    "PMSUM": "",
    "POSUM": "",
    "Difference": "",
    "DifferenceDESC": ""
  }]
};

/**
 * 记录页面访问和工具使用情况（仅在用户停留超过10秒且有操作时统计）
 * @param {string} toolId - 工具ID
 * @param {string} toolName - 工具名称
 * @returns {Promise<void>} 记录操作的Promise
 */
export async function recordPageVisit(toolId, toolName) {
  // 确保在浏览器环境中运行且Chrome存储API可用
  if (typeof chrome !== 'undefined' && chrome.storage && typeof window !== 'undefined') {
    try {
      // 页面加载时间
      const pageLoadTime = Date.now();
      let hasUserInteracted = false;
      let isRecorded = false;
      
      // 用户交互事件类型
      const interactionEvents = ['click', 'mousemove', 'keydown', 'touchstart'];
      
      // 延迟记录函数
      const delayedRecord = async () => {
        if (!isRecorded && hasUserInteracted) {
          // 获取当前时间戳
          const timestamp = new Date().toISOString();
          
          // 1. 更新使用历史
          const historyResult = await chrome.storage.local.get('usageHistory');
          const usageHistory = Array.isArray(historyResult.usageHistory) ? historyResult.usageHistory : [];
          
          // 添加新记录
          usageHistory.push({
            toolId: toolId,
            toolName: toolName,
            timestamp: timestamp
          });
          
          // 只保留最近100条记录以避免数据过大
          if (usageHistory.length > 100) {
            usageHistory.splice(0, usageHistory.length - 100);
          }
          
          // 2. 更新工具使用统计
          const statsResult = await chrome.storage.local.get('toolUsageStats');
          const toolUsageStats = statsResult.toolUsageStats || {};
          
          // 增加使用计数
          if (toolUsageStats[toolId]) {
            toolUsageStats[toolId]++;
          } else {
            toolUsageStats[toolId] = 1;
          }
          
          // 3. 保存更新后的数据
          await chrome.storage.local.set({
            usageHistory: usageHistory,
            toolUsageStats: toolUsageStats
          });
          
          isRecorded = true;
          // 清理事件监听器
          cleanupEventListeners();
        }
      };
      
      // 事件处理函数
      const handleInteraction = () => {
        hasUserInteracted = true;
        // 检查是否已经过了至少10秒
        const elapsedTime = Date.now() - pageLoadTime;
        if (elapsedTime >= 10000) {
          delayedRecord();
        }
      };
      
      // 添加事件监听器
      interactionEvents.forEach(event => {
        window.addEventListener(event, handleInteraction, { once: true, passive: true });
      });
      
      // 清理函数
      const cleanupEventListeners = () => {
        interactionEvents.forEach(event => {
          window.removeEventListener(event, handleInteraction);
        });
        if (timer) clearTimeout(timer);
      };
      
      // 设置10秒定时器
      const timer = setTimeout(() => {
        if (hasUserInteracted) {
          delayedRecord();
        } else {
          // 如果10秒内没有用户交互，清理事件监听器
          cleanupEventListeners();
        }
      }, 10000);
      
    } catch (error) {
      console.error('记录页面访问失败:', error);
    }
  }
}

// ======== 日期工具函数 ========

/**
 * 获取当前日期字符串（YYYY-MM-DD）
 * @returns {string} 格式化的日期字符串
 */
export function nowDate() {
  const date = new Date();
  return formatDate(date);
}

/**
 * 初始化日期选择器
 * @param {string|HTMLElement} element - 元素ID或DOM元素
 * @param {Object} options - 配置选项
 */
export function initDatePicker(element, options = {}) {
  // 确保laydate库已加载
  if (window.laydate) {
    // 全局参数设置 - 可以在这里通过set方法设置全局基础参数
    // 这些参数将应用于所有日期选择器实例
    try {
      window.laydate.set({
        // 全局配置选项
        lang: 'cn', // 语言设置为中文
        theme: '#2563eb' // 使用默认主题
      });
    } catch (error) {
      console.warn('设置laydate全局参数失败:', error);
    }
    // 处理元素参数
    const target = typeof element === 'string' ? document.getElementById(element) : element;

    if (target) {
      // 处理格式参数 - 支持大写和小写格式
      let format = options.format || 'yyyy-MM-dd';
      // 如果用户传入的是小写格式，转换为大写格式（因为这个版本的laydate可能需要大写）
      // if (format.includes('yyyy') || format.includes('mm') || format.includes('dd')) {
      //   format = format.replace('yyyy', 'YYYY').replace('mm', 'MM').replace('dd', 'DD');
      // }

      // 处理value参数 - 确保日期格式完全合法
      let value = options.value;
      if (value) {
        // 验证用户提供的日期值格式
        try {
          // 尝试直接使用formatDate函数格式化用户提供的日期值
          // 这个函数会处理各种日期格式并返回标准格式
          value = formatDate(new Date(value));
        } catch (error) {
          console.warn('解析用户提供的日期值失败，使用当前日期:', error);
          value = nowDate();
        }
      } else {
        value = nowDate();
      }
      console.log('传递给laydate的日期值和格式:', { value, format });

      // 合并默认配置和用户配置
      const config = {
        elem: typeof element === 'string' ? '#' + element : '#' + target.id, // 使用选择器格式
        format: format,
        value: value,
        type: options.type || 'date', // 支持 date, time, datetime 类型
        choose: options.onSelect || function (dates) {
          if (options.done) {
            options.done(dates);
          }
        },
        showBottom: true, // 显示底部确认按钮
        btns: ['now', 'confirm'] // 显示当前时间和确认按钮
      };

      try {
        // 初始化laydate - 使用render方法设置基础参数
        return window.laydate.render(config);
      } catch (error) {
        console.error('初始化日期选择器失败:', error);
      }
    } else {
      console.warn('未找到日期选择器目标元素:', element);
    }
  } else {
    console.warn('laydate库未加载，请确保正确引入laydate库');
  }
  return null;
}

/**
 * 格式化日期对象为字符串（YYYY-MM-DD）
 * 确保生成的日期格式与laydate库的要求完全匹配
 * @param {Date|string} date - 日期对象或日期字符串
 * @returns {string} 格式化的日期字符串
 */
export function formatDate(date) {
  // 检查参数类型，如果是字符串则尝试解析为日期对象
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  // 处理无效日期
  if (!date || isNaN(date.getTime())) {
    const now = new Date();
    date = now;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  // 验证日期格式有效性
  const dateParts = formattedDate.split('-');
  if (dateParts.length !== 3 ||
    dateParts[0].length !== 4 ||
    dateParts[1].length !== 2 ||
    dateParts[2].length !== 2) {
    console.warn('生成的日期格式无效:', formattedDate);
  }

  return formattedDate;
}

/**
 * 给日期字符串增加指定天数
 * @param {string} dateStr - 日期字符串（YYYY-MM-DD）
 * @param {number} days - 要增加的天数
 * @returns {string} 增加天数后的日期字符串
 */
export function addDay(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * 给日期对象增加指定天数
 * @param {Date} date - 日期对象
 * @param {number} days - 要增加的天数
 * @returns {Date} 增加天数后的日期对象
 */
export function addDayObj(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

// ======== UI相关函数 ========

/**
 * 显示模态框
 * @param {string} title - 模态框标题
 * @param {string} message - 模态框内容
 * @param {Object} options - 配置选项（可选）
 * @param {string} options.confirmText - 确认按钮文本
 * @param {Function} options.onConfirm - 确认按钮点击回调
 */
/**
 * 显示顶部悬浮提示
 * @param {string} message - 提示消息内容
 * @param {string} type - 提示类型（info、success、warning、error）
 * @param {number} duration - 提示显示时长（毫秒）
 */
export function showTopAlert(message, type = 'info', duration = 3000) {
  // 移除已存在的悬浮提示
  const existingAlert = document.getElementById('floating-top-alert');
  if (existingAlert) {
    existingAlert.remove();
  }

  // 创建悬浮提示容器
  const alertDiv = document.createElement('div');
  alertDiv.id = 'floating-top-alert';
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '20px';
  alertDiv.style.left = '50%';
  alertDiv.style.transform = 'translateX(-50%)';
  alertDiv.style.zIndex = '10000';
  alertDiv.style.width = '90%';
  alertDiv.style.maxWidth = '500px';
  alertDiv.style.opacity = '0';
  alertDiv.style.transition = 'opacity 0.3s ease-in-out';
  alertDiv.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  alertDiv.style.borderRadius = '8px';
  alertDiv.style.padding = '12px';
  alertDiv.style.margin = '0 auto';
  alertDiv.style.display = 'flex';
  alertDiv.style.alignItems = 'center';
  alertDiv.style.justifyContent = 'space-between';
  alertDiv.style.backdropFilter = 'blur(8px)';
  alertDiv.style.border = '1px solid rgba(255, 255, 255, 0.3)';

  // 根据类型设置样式
  const icon = type === 'info' ? 'ℹ️' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
  
  if (type === 'info') {
    alertDiv.style.backgroundColor = 'rgba(219, 234, 254, 0.9)';
    alertDiv.style.color = '#1e40af';
  } else if (type === 'success') {
    alertDiv.style.backgroundColor = 'rgba(209, 250, 229, 0.9)';
    alertDiv.style.color = '#065f46';
  } else if (type === 'warning') {
    alertDiv.style.backgroundColor = 'rgba(254, 243, 199, 0.9)';
    alertDiv.style.color = '#92400e';
  } else {
    alertDiv.style.backgroundColor = 'rgba(254, 226, 226, 0.9)';
    alertDiv.style.color = '#991b1b';
  }

  // 设置提示内容
  alertDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 18px;">${icon}</span>
      <span style="font-size: 14px;">${message}</span>
    </div>
    <button type="button" style="background: none; border: none; cursor: pointer; padding: 4px; color: inherit;" onclick="document.getElementById('floating-top-alert').remove()">
      <i class="ri-close-line text-sm"></i>
    </button>
  `;

  // 添加到页面
  document.body.appendChild(alertDiv);

  // 显示提示
  setTimeout(() => {
    alertDiv.style.opacity = '1';
  }, 10);

  // 自动隐藏
  setTimeout(() => {
    alertDiv.style.opacity = '0';
    setTimeout(() => {
      if (document.getElementById('floating-top-alert')) {
        document.getElementById('floating-top-alert').remove();
      }
    }, 300);
  }, duration);
}

export function showModal(title, message, options = {}) {
  const modal = document.getElementById('DefaultModal');

  if (!modal) {
    console.warn('未找到模态框元素');
    return;
  }

  const modalLabel = document.getElementById('DefaultModalLabel');
  const modalText = document.getElementById('DefaultModalText');
  const confirmBtn = document.getElementById('DefaultModalConfirmBtn');

  if (modalLabel) modalLabel.textContent = title;

  // 检查message是否包含HTML标签，如果包含则使用innerHTML
  if (modalText) {
    if (message && (message.includes('<') && message.includes('>'))) {
      modalText.innerHTML = message;
    } else {
      modalText.textContent = message;
    }
  }

  // 设置确认按钮文本和回调
  if (confirmBtn) {
    // 移除之前的事件监听器
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    // 设置按钮文本
    if (options.confirmText) {
      newConfirmBtn.textContent = options.confirmText;
    }

    // 无论是否有onConfirm回调，都添加关闭模态框的逻辑
    newConfirmBtn.addEventListener('click', async () => {
      if (typeof options.onConfirm === 'function') {
        await options.onConfirm();
      }
      // 确保模态框总是能关闭
      modal.classList.add('hidden');
    });
  }

  // 显示模态框
  modal.classList.remove('hidden');
}

/**
 * 显示确认模态框（带确认和取消按钮）
 * @param {string} title - 模态框标题
 * @param {string} message - 模态框内容
 * @param {Object} options - 配置选项
 * @param {string} options.confirmText - 确认按钮文本，默认为"确定"
 * @param {string} options.cancelText - 取消按钮文本，默认为"取消"
 * @param {Function} options.onConfirm - 确认按钮点击回调
 * @param {Function} options.onCancel - 取消按钮点击回调（可选）
 */
export function showConfirmModal(title, message, options = {}) {
  const modal = document.getElementById('DefaultModal');

  if (!modal) {
    console.warn('未找到模态框元素');
    return;
  }

  const modalLabel = document.getElementById('DefaultModalLabel');
  const modalText = document.getElementById('DefaultModalText');
  const confirmBtn = document.getElementById('DefaultModalConfirmBtn');

  if (modalLabel) modalLabel.textContent = title;

  // 检查message是否包含HTML标签，如果包含则使用innerHTML
  if (modalText) {
    if (message && (message.includes('<') && message.includes('>'))) {
      modalText.innerHTML = message;
    } else {
      modalText.textContent = message;
    }
  }

  // 设置确认按钮文本和回调
  if (confirmBtn) {
    // 移除之前的事件监听器
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    // 设置按钮文本
    newConfirmBtn.textContent = options.confirmText || '确定';

    // 添加确认按钮点击事件
    newConfirmBtn.addEventListener('click', async () => {
      if (typeof options.onConfirm === 'function') {
        await options.onConfirm();
      }
      // 确保模态框总是能关闭
      modal.classList.add('hidden');
    });
  }

  // 显示模态框
  modal.classList.remove('hidden');
}

/**
 * 初始化模态框
 */
export function initModal() {
  const modal = document.getElementById('DefaultModal');
  const modalCloseBtn = document.getElementById('DefaultModalCloseBtn');
  const modalConfirmBtn = document.getElementById('DefaultModalConfirmBtn');

  // 确保元素存在
  function addCloseEvent(element) {
    if (element) {
      element.addEventListener('click', () => {
        if (modal) {
          modal.classList.add('hidden');
        }
      });
    }
  }

  // 为关闭按钮和确认按钮添加关闭事件
  addCloseEvent(modalCloseBtn);
  addCloseEvent(modalConfirmBtn);
}

/**
 * 切换日期锁定状态
 * @param {Event} event - 点击事件对象
 */
export function toggleDateLock(event) {
  const button = event.target.closest('button');

  if (!button) {
    console.warn('未找到日期锁定按钮');
    return;
  }

  if (button.classList.contains('bg-gray-100')) {
    // 锁定日期
    button.classList.remove('bg-gray-100', 'text-gray-600', 'text-gray-700', 'hover:bg-gray-200');
    button.classList.add('bg-red-500', 'text-white');
  } else {
    // 解锁日期
    button.classList.remove('bg-red-500', 'text-white');
    button.classList.add('bg-gray-100', 'text-gray-600', 'hover:bg-gray-200');
  }
}

/**
 * 重置日期锁定按钮状态
 * @param {string} buttonId - 按钮ID
 */
export function resetDateLockButton(buttonId) {
  const button = document.getElementById(buttonId);

  if (!button) {
    console.warn('未找到日期锁定按钮:', buttonId);
    return;
  }

  // 重置为默认解锁状态
  button.classList.remove('bg-red-500', 'text-white');
  button.classList.add('bg-gray-100', 'text-gray-600', 'hover:bg-gray-200');
}

// ======== 设置相关函数 ========

/**
 * 从Chrome存储获取设置
 * @returns {Promise<Object>} 设置对象
 */
export async function getSettings() {
  try {
    const result = await chrome.storage.local.get(['options']);
    appOptions = result.options || {};
    return appOptions;
  } catch (error) {
    console.error('获取设置失败:', error);
    return {};
  }
}

/**
 * 保存设置到Chrome存储
 * @param {Object} settings - 设置对象
 * @returns {Promise<boolean>} 是否保存成功
 */
export async function saveSettings(settings) {
  try {
    await chrome.storage.local.set({ options: settings });
    appOptions = settings;
    return true;
  } catch (error) {
    console.error('保存设置失败:', error);
    showModal('错误', '保存设置失败，请稍后重试。');
    return false;
  }
}

/**
 * 获取默认设置
 * @returns {Object} 默认设置对象
 */
export function getDefaultSettings() {
  return {
    Hotel: [{ HotelName: '', HotelAddress: '', HotelPhone: '', HotelNumber: '', HotelZip: '', HotelFax: '' }],
    Staff: [{ StaffName: '' }],
    Consumption: [],
    Payment: [],
    Vip: [],
    AI: {
      AIModelType: 'doubao-1-5-pro-32k-250115',
      AIModelVersion: 'latest',
      APIBaseURL: 'https://openapi.beida.xyz/v1',
      APIKey: '',
      MaxTokens: 16000,
      Temperature: 0.7,
      TopP: 1,
      FrequencyPenalty: 0,
      PresencePenalty: 0,
      EnableCache: true,
      CacheExpirationMinutes: 30,
      // 预设的系统提示词
      systemPrompts: [
        {
          id: 'prompt1',
          title: '网评回复',
          content: '我是一家亚朵酒店，请根据我提供的客人点评内容回复点评。客人称呼为朵友，我们自己称呼为朵儿，员工称为伙伴。亲爱的朵友开头。好评观点回复字数不宜过多，有差评观点针对性回复。如点评好评观点比较多的，选取最好的那个针对性回复，不要服务、设施、卫生全都提及。好评回复50-80字，差评回复80-200字'
        },
        {
          id: 'prompt2',
          title: '酒店客服',
          content: '你是一名专业的酒店客服代表，负责回答客人关于酒店设施、服务、预订政策等方面的问题。请使用友好、专业的语气回答。'
        },
        {
          id: 'prompt3',
          title: '旅游顾问',
          content: '你是一名经验丰富的旅游顾问，能够为用户提供旅游目的地推荐、行程规划、交通建议等服务。请根据用户需求提供个性化的旅游建议。'
        }
      ]
    }
  };
}

/**
 * 应用主题
 * @param {string} theme - 主题名称（light或dark）
 */
export function applyTheme(theme) {
  document.body.classList.remove('bg-gray-50', 'bg-gray-900', 'text-white', 'text-gray-800');

  if (theme === 'dark') {
    document.body.classList.add('bg-gray-900', 'text-white');
    document.querySelectorAll('div.bg-white').forEach(el => {
      el.classList.remove('bg-white');
      el.classList.add('bg-gray-800');
    });
  } else {
    document.body.classList.add('bg-gray-50', 'text-gray-800');
    document.querySelectorAll('div.bg-gray-800').forEach(el => {
      el.classList.remove('bg-gray-800');
      el.classList.add('bg-white');
    });
  }
}
