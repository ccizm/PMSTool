/**
 * PMS工具扩展的弹出菜单脚本
 * 提供基础功能支持和自动生成导航菜单
 */

// 导入公共函数
import { getSettings as getGlobalSettings, saveSettings as saveGlobalSettings, createNavbar, getNavbarLinks } from '../main.js';
// 导入提醒功能共享工具
import { getSortedTodayReminders, createReminderItemElement, showEmptyReminderMessage } from '../reminderUtils.js';

// 全局变量存储设置
let settings = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
  console.log('PMS工具弹出菜单已加载');
  
  try {
    // 加载设置
    await loadSettings();
    
    // 根据main.js中的navLinks数据自动生成导航菜单
    generateNavigationMenu();
    
    // 初始化菜单链接事件处理
    initMenuLinks();
    
    // 初始化时钟
    await updateClock();
    setInterval(updateClock, 1000);
    
    // 加载并显示提醒列表
    await loadAndDisplayReminders();
    
    // 监听chrome.storage.local变化，用于同步提醒更新
    chrome.storage.local.onChanged.addListener(function(changes, areaName) {
      if (areaName === 'local' && changes.newclockSettings) {
        loadAndDisplayReminders();
      }
    });
  } catch (error) {
    console.error('弹出菜单初始化失败:', error);
  }
});

/**
 * 根据main.js中的navLinks数据生成导航菜单
 */
function generateNavigationMenu() {
  // 获取导航栏数据 - 从main.js导入
  const { main: navLinks } = getNavbarLinks();
  
  // 获取菜单容器
  const menuContainer = document.querySelector('.divide-y.divide-gray-200');
  if (!menuContainer) {
    console.error('未找到菜单容器');
    return;
  }
  
  // 清空现有菜单
  menuContainer.innerHTML = '';
  
  // 根据navLinks数据生成新的菜单
  navLinks.forEach(link => {
    if (link.isDropdown && link.sublinks) {
      // 生成下拉菜单
      createDropdownMenu(menuContainer, link);
    } else {
      // 生成普通链接
      createMenuItem(menuContainer, link);
    }
  });
}



/**
 * 创建菜单项
 */
function createMenuItem(container, linkData) {
  const a = document.createElement('a');
  a.href = linkData.url;
  a.target = '_blank';
  a.className = 'flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors';
  
  // 根据链接ID设置不同的图标颜色
  let iconColor = 'text-indigo-600'; // 默认颜色
  switch (linkData.id) {
    case 'index':
      iconColor = 'text-indigo-600';
      break;
    case 'checkout':
      iconColor = 'text-blue-600';
      break;
    case 'pricecalc':
      iconColor = 'text-green-600';
      break;
    case 'commonInfo':
      iconColor = 'text-amber-600';
      break;
    case 'handoversheet':
      iconColor = 'text-red-600';
      break;
    case 'options':
      iconColor = 'text-purple-600';
      break;
    default:
      iconColor = 'text-gray-600';
  }
  
  // 根据链接ID设置不同的图标
  const icon = document.createElement('i');
  let iconClass = '';
  switch (linkData.id) {
    case 'index':
      iconClass = 'ri-dashboard-line';
      break;
    case 'checkout':
    case 'handoversheet':
      iconClass = 'ri-file-list-line';
      break;
    case 'pricecalc':
      iconClass = 'ri-calculator-line';
      break;
    case 'commonInfo':
      iconClass = 'ri-book-open-line';
      break;
    case 'options':
      iconClass = 'ri-settings-line';
      break;
    case 'newclock':
      iconClass = 'ri-time-line';
      break;
    case 'aiassistant':
      iconClass = 'ri-chat-ai-line';
      break;
    default:
      iconClass = 'ri-arrow-right-s-line'; // 默认箭头图标
  }
  
  icon.className = `text-base mr-3 ${iconColor} ${iconClass}`;
  
  // 创建文本节点
  const textNode = document.createTextNode(linkData.name);
  
  // 组装菜单项
  a.appendChild(icon);
  a.appendChild(textNode);
  
  // 添加到容器
  container.appendChild(a);
  
  // 返回创建的元素
  return a;
}

/**
 * 创建抽屉菜单
 */
function createDropdownMenu(container, dropdownData) {
  // 创建抽屉菜单标题容器
  const drawerTitle = document.createElement('div');
  drawerTitle.className = 'flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer';
  
  // 创建左侧内容容器 - 包含图标和文本
  const leftContent = document.createElement('div');
  leftContent.className = 'flex items-center';
  
  // 设置图标颜色
  let iconColor = 'text-gray-600';
  if (dropdownData.id === 'tools') {
    iconColor = 'text-blue-600';
  }
  
  // 添加图标到左侧容器
  const icon = document.createElement('i');
  let iconClass = '';
  if (dropdownData.id === 'tools') {
    // 工具图标
    iconClass = 'ri-tools-line';
  } else {
    iconClass = 'ri-menu-line'; // 默认菜单图标
  }
  
  icon.className = `text-base mr-3 ${iconColor} ${iconClass}`;
  leftContent.appendChild(icon);
  
  // 添加标题文本到左侧容器
  const titleText = document.createTextNode(dropdownData.name);
  leftContent.appendChild(titleText);
  
  // 添加左侧内容容器到标题容器
  drawerTitle.appendChild(leftContent);
  
  // 添加右侧图标
  const rightIcon = document.createElement('i');
  rightIcon.className = 'ri-arrow-right-s-line text-base text-gray-500 transition-transform';
  drawerTitle.appendChild(rightIcon);
  
  // 添加到容器
  container.appendChild(drawerTitle);
  
  // 点击标题时打开抽屉菜单
  drawerTitle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 检查是否已存在抽屉菜单
    let drawerMenu = document.getElementById('popupDrawerMenu');
    let drawerOverlay = document.getElementById('popupDrawerOverlay');
    
    // 如果抽屉菜单已存在，先移除
    if (drawerMenu) {
      drawerMenu.remove();
    }
    
    if (drawerOverlay) {
      drawerOverlay.remove();
    }
    
    // 创建蒙层背景
    drawerOverlay = document.createElement('div');
    drawerOverlay.id = 'popupDrawerOverlay';
    drawerOverlay.className = 'fixed inset-0 bg-black bg-opacity-0 z-40 transition-all duration-300 ease-in-out';
    document.body.appendChild(drawerOverlay);
    
    // 创建抽屉菜单容器
    drawerMenu = document.createElement('div');
    drawerMenu.id = 'popupDrawerMenu';
    drawerMenu.className = 'fixed top-0 right-0 h-full w-64 bg-white shadow-xl transform translate-x-full transition-transform duration-300 ease-in-out z-50';
    document.body.appendChild(drawerMenu);
    
    // 添加蒙层淡入效果
    setTimeout(() => {
      drawerOverlay.classList.remove('bg-opacity-0');
      drawerOverlay.classList.add('bg-opacity-50');
    }, 10);
    
    // 创建抽屉菜单头部
    const drawerHeader = document.createElement('div');
    drawerHeader.className = 'p-4 border-b border-gray-200 flex justify-between items-center';
    
    const drawerTitleElement = document.createElement('h3');
    drawerTitleElement.className = 'text-lg font-medium text-gray-800';
    drawerTitleElement.textContent = dropdownData.name;
    drawerHeader.appendChild(drawerTitleElement);
    
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-500 hover:text-gray-800 focus:outline-none';
    closeButton.innerHTML = '<i class="ri-close-line text-lg"></i>';
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeDrawer(drawerMenu, drawerOverlay);
    });
    drawerHeader.appendChild(closeButton);
    
    drawerMenu.appendChild(drawerHeader);
    
    // 创建抽屉菜单内容
    const drawerContent = document.createElement('div');
    drawerContent.className = 'py-2';
    
    // 添加子链接
    dropdownData.sublinks.forEach(sublink => {
      const menuItem = createMenuItem(drawerContent, sublink);
      // 点击子链接后关闭抽屉
      if (menuItem) {
        menuItem.addEventListener('click', () => {
          closeDrawer(drawerMenu, drawerOverlay);
        });
      }
    });
    
    drawerMenu.appendChild(drawerContent);
    
    // 添加动画效果
    setTimeout(() => {
      drawerMenu.classList.remove('translate-x-full');
    }, 10);
    
    // 点击蒙层关闭抽屉
    drawerOverlay.addEventListener('click', () => {
      closeDrawer(drawerMenu, drawerOverlay);
    });
  });
}

/**
 * 关闭抽屉菜单
 */
function closeDrawer(drawerMenu, drawerOverlay) {
  if (!drawerMenu || !drawerOverlay) return;
  
  // 添加抽屉滑出动画
  drawerMenu.classList.add('translate-x-full');
  
  // 添加蒙层淡出动画
  drawerOverlay.classList.remove('bg-opacity-50');
  drawerOverlay.classList.add('bg-opacity-0');
  
  // 移除蒙层和抽屉
  setTimeout(() => {
    if (drawerOverlay) drawerOverlay.remove();
    if (drawerMenu) drawerMenu.remove();
  }, 300);
}

/**
 * 初始化菜单链接的点击事件
 */
function initMenuLinks() {
  const menuLinks = document.querySelectorAll('a');
  
  menuLinks.forEach(link => {
    if (link && typeof link.addEventListener === 'function') {
      link.addEventListener('click', (event) => {
        // 记录用户点击的菜单项
        const menuItem = link.textContent.trim();
        console.log(`用户点击了菜单项: ${menuItem}`);
        
        // 可以在这里添加菜单点击的额外处理逻辑
        // 例如：记录使用统计、权限检查等
      });
    }
  });
}

/**
 * 加载设置
 */
async function loadSettings() {
  try {
    // 使用从main.js导入的getSettings函数
    settings = await getGlobalSettings();
    return settings;
  } catch (error) {
    console.error('获取设置失败:', error);
  }
}

/**
 * 保存设置
 */
async function saveSettings(newSettings) {
  try {
    // 使用从main.js导入的saveSettings函数
    await saveGlobalSettings(newSettings);
    settings = newSettings;
  } catch (error) {
    console.error('保存设置失败:', error);
  }
}

/**
 * 加载newclock设置
 */
async function loadNewclockSettings() {
  try {
    // 从chrome.storage.local加载newclock设置
    const result = await chrome.storage.local.get('newclockSettings');
    if (result.newclockSettings) {
      return result.newclockSettings;
    }
  } catch (error) {
    console.error('从chrome.storage.local加载设置失败:', error);
    
    // 降级方案：从localStorage加载
    const settings = localStorage.getItem('newclockSettings');
    if (settings) {
      return JSON.parse(settings);
    }
  }
  
  // 返回默认设置
  return {
    hour12: false,
    showSeconds: true,
    showDate: true,
    reminders: []
  };
}

/**
 * 更新时钟显示
 */
async function updateClock() {
  const now = new Date();
  const popupDigitalClock = document.getElementById('popupDigitalClock');
  const popupDateDisplay = document.getElementById('popupDateDisplay');
  
  if (!popupDigitalClock || !popupDateDisplay) return;
  
  try {
    // 加载设置
    const settings = await loadNewclockSettings();
  
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();
  
  // 格式化时间
  if (settings.hour12) {
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 转为 12
  }
  
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');
  
  if (settings.showSeconds) {
    popupDigitalClock.textContent = `${hoursStr}:${minutesStr}:${secondsStr}`;
  } else {
    popupDigitalClock.textContent = `${hoursStr}:${minutesStr}`;
  }
  
  // 更新日期显示
  if (settings.showDate) {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    };
    popupDateDisplay.textContent = now.toLocaleDateString('zh-CN', options);
    popupDateDisplay.style.display = 'block';
  } else {
    popupDateDisplay.style.display = 'none';
  }
  } catch (error) {
    console.error('更新时钟显示失败:', error);
  }
}

/**
 * 加载并显示提醒列表
 */
async function loadAndDisplayReminders() {
  const popupReminderList = document.getElementById('popupReminderList');
  if (!popupReminderList) return;
  
  // 清空列表
  popupReminderList.innerHTML = '';
  
  try {
    // 加载设置
    const settings = await loadNewclockSettings();
    
    // 获取今天的提醒并排序
    const todayReminders = getSortedTodayReminders(settings.reminders);
    
    if (todayReminders.length === 0) {
      showEmptyReminderMessage(popupReminderList, {
        message: `暂无提醒事项，去<a class="text-blue-600" href="${chrome.runtime.getURL('/src/newclock/newclock.html')}" target="_blank">添加提醒</a>`,
        smallPadding: true
      });
      return;
    }
    
    todayReminders.forEach(reminder => {
      const reminderItem = createReminderItem(reminder);
      popupReminderList.appendChild(reminderItem);
    });
  } catch (error) {
    console.error('加载并显示提醒列表失败:', error);
    showEmptyReminderMessage(popupReminderList, {
      message: '加载提醒失败',
      smallPadding: true
    });
  }
}

/**
 * 创建提醒项
 */
function createReminderItem(reminder) {
  // 使用共享的创建提醒项函数，设置小字体和分割线
  return createReminderItemElement(reminder, {
    onDelete: null, // popup页面没有删除功能
    showDivider: true,
    smallText: true
  });
}