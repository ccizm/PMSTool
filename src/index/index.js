import { setPageTitle, createNavbar, getSettings, options, showModal, showConfirmModal, recordPageVisit } from '/src/main.js';
import { getSortedTodayReminders, showEmptyReminderMessage, createReminderItemElement } from '/src/reminderUtils.js';

// 当DOM加载完成后执行初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 设置页面标题
  setPageTitle();
  // 创建统一导航栏
  createNavbar();
  // 初始化工作台
  await initWorkbench();
  
  // 动态生成导航菜单
  await initDynamicNavigation();
  
  // 监听chrome.storage.local变化，用于同步提醒更新
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.onChanged.addListener(function(changes, areaName) {
      if (areaName === 'local' && changes.newclockSettings) {
        loadTodayReminders();
      }
    });
  }
});

// 初始化工作台
async function initWorkbench() {
  try {
    // 获取当前时间
    const now = new Date();
    const hours = now.getHours();
    
    // 根据时间生成问候语
    let greeting = '欢迎回来';
    if (hours < 12) {
      greeting = '早上好';
    } else if (hours < 18) {
      greeting = '下午好';
    } else {
      greeting = '晚上好';
    }
    
    document.getElementById('greeting-text').textContent = greeting;
    document.getElementById('current-time').textContent = now.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    });
    
    // 设置日期显示
    document.getElementById('current-date').textContent = now.toLocaleDateString('zh-CN', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    // 加载设置
    const settings = await getSettings();
    
    // 加载用户信息
    const userInfo = settings.Staff && settings.Staff.length > 0 ? 
      settings.Staff[0].StaffName : '酒店人';
    document.getElementById('user-name').textContent = userInfo;
    
    // 加载酒店信息
    const hotelInfo = settings.Hotel && settings.Hotel.length > 0 ? 
      settings.Hotel[0].HotelName : options.Hotel[0].HotelName;
    document.getElementById('hotel-name').textContent = hotelInfo;
    
    // 记录工作台访问
    await recordPageVisit('index', '工作台');
    
    // 加载今日提醒
    await loadTodayReminders();
    
    // 加载最近使用记录
    await loadRecentActivities();
    
    // 更新使用统计
    await updateUsageStats();
    
    // 启动时钟更新
    setInterval(updateClock, 1000);
    
  } catch (error) {
    console.error('初始化工作台失败:', error);
  }
}

// 动态生成导航菜单
async function initDynamicNavigation() {
  try {
    // 这里可以根据用户权限或设置动态调整导航
    // 目前保持原有导航结构
    console.log('导航菜单已初始化');
  } catch (error) {
    console.error('初始化导航菜单失败:', error);
  }
}

// 更新时钟显示
function updateClock() {
  const now = new Date();
  document.getElementById('current-time').textContent = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit'
  });
}

// 加载今日提醒
async function loadTodayReminders() {
  try {
    // 从存储中获取提醒设置
    let reminders = [];
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get('newclockSettings');
      if (result.newclockSettings) {
        reminders = result.newclockSettings.reminders || [];
      }
    }
    
    // 获取今天的提醒并排序
    const todayReminders = getSortedTodayReminders(reminders);
    
    const reminderList = document.getElementById('today-reminders');
    if (!reminderList) return;
    
    // 清空列表
    reminderList.innerHTML = '';
    
    if (todayReminders.length === 0) {
      showEmptyReminderMessage(reminderList, {
        message: `今天暂无提醒事项，去<a class="text-blue-600" href="${chrome.runtime.getURL('/src/newclock/newclock.html')}" target="_blank">添加提醒</a>`,
        smallPadding: false
      });
      return;
    }
    
    // 添加提醒项
    todayReminders.forEach(reminder => {
      const reminderItem = createReminderItem(reminder);
      reminderList.appendChild(reminderItem);
    });
    
  } catch (error) {
    console.error('加载提醒失败:', error);
    const reminderList = document.getElementById('today-reminders');
    if (reminderList) {
      showEmptyReminderMessage(reminderList, {
        message: '加载提醒失败',
        smallPadding: false
      });
    }
  }
}


/**
 * 创建提醒项
 */
function createReminderItem(reminder) {
  // 使用共享的创建提醒项函数
  return createReminderItemElement(reminder, {
    onDelete: null, // 工作台页面不直接提供删除功能
    showDivider: true,
    smallText: false
  });
}

// 根据提醒类型获取颜色
function getReminderTypeColor(type) {
  const colorMap = {
    'daily': 'blue',
    'meeting': 'purple',
    'task': 'green',
    'other': 'gray'
  };
  return colorMap[type] || 'blue';
}

// 根据提醒类型获取图标
function getReminderTypeIcon(type) {
  const iconMap = {
    'daily': '<i class="ri-calendar-todo-line text-sm"></i>',
    'meeting': '<i class="ri-calendar-event-line text-sm"></i>',
    'task': '<i class="ri-check-square-line text-sm"></i>',
    'other': '<i class="ri-information-line text-sm"></i>'
  };
  return iconMap[type] || iconMap['other'];
}

// 加载最近使用记录
async function loadRecentActivities() {
  try {
    // 获取实际使用记录
    let recentActivities = [];
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get('usageHistory');
      if (result.usageHistory && Array.isArray(result.usageHistory)) {
        // 按时间排序，并获取最近5条记录
        const recentItems = result.usageHistory
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5);
        
        // 并行获取使用次数
        const countPromises = recentItems.map(item => getToolUsageCount(item.toolId));
        const counts = await Promise.all(countPromises);
        
        // 组装结果
        recentActivities = recentItems.map((item, index) => ({
          id: item.toolId,
          name: getToolNameById(item.toolId),
          time: formatRelativeTime(item.timestamp),
          count: counts[index]
        }));
        
        // 过滤掉未知工具
        recentActivities = recentActivities.filter(activity => activity.name !== '未知工具');
      }
    }
    
    // 如果没有实际记录，不使用默认数据
    if (recentActivities.length === 0) {
      recentActivities = [];
    }
    
    const recentList = document.getElementById('recent-activities');
    if (!recentList) return;
    
    // 清空列表
    recentList.innerHTML = '';
    
    // 添加最近使用项
    recentActivities.forEach(activity => {
      const activityItem = document.createElement('a');
      activityItem.href = `/src/${activity.id}/${activity.id}.html`;
      activityItem.className = 'flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors';
      
      // 图标
      const icon = document.createElement('div');
      icon.className = 'flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3';
      icon.innerHTML = getActivityIcon(activity.id);
      
      // 内容
      const content = document.createElement('div');
      content.className = 'flex-grow';
      
      const name = document.createElement('div');
      name.className = 'font-medium text-gray-800';
      name.textContent = activity.name;
      
      const time = document.createElement('div');
      time.className = 'text-sm text-gray-500';
      time.textContent = activity.time;
      
      content.appendChild(name);
      content.appendChild(time);
      
      // 使用次数
      const count = document.createElement('div');
      count.className = 'text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full';
      count.textContent = `${activity.count}次`;
      
      activityItem.appendChild(icon);
      activityItem.appendChild(content);
      activityItem.appendChild(count);
      
      recentList.appendChild(activityItem);
    });
    
  } catch (error) {
    console.error('加载最近活动失败:', error);
  }
}

// 根据工具ID获取工具名称
function getToolNameById(toolId) {
  const toolNames = {
    'options': '设置',
    'index': '控制台',
    'checkout': '结账单制作',
    'pricecalc': '房价计算器',
    'commonInfo': '查常用信息',
    'handoversheet': 'POS差异单',
    'aiassistant': 'AI助手',
    'newclock': '时钟报时器'
  };
  return toolNames[toolId] || '未知工具';
}

// 格式化相对时间
function formatRelativeTime(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}天前`;
}

// 获取工具使用次数
async function getToolUsageCount(toolId) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const result = await chrome.storage.local.get('toolUsageStats');
    if (result.toolUsageStats && result.toolUsageStats[toolId]) {
      return result.toolUsageStats[toolId];
    }
  }
  return Math.floor(Math.random() * 10) + 1; // 随机数作为默认值
}

// 获取活动图标
function getActivityIcon(id) {
  const iconMap = {
    'options': '<i class="ri-settings-line text-base text-purple-600"></i>',
    'index': '<i class="ri-dashboard-line text-base text-gray-600"></i>',
    'checkout': '<i class="ri-file-list-line text-base text-blue-600"></i>',
    'pricecalc': '<i class="ri-calculator-line text-base text-green-600"></i>',
    'commonInfo': '<i class="ri-book-open-line text-base text-yellow-600"></i>',
    'handoversheet': '<i class="ri-exchange-box-line text-base text-purple-600"></i>',
    'aiassistant': '<i class="ri-chat-ai-line text-base text-purple-600"></i>',
    'newclock': '<i class="ri-time-line text-base text-purple-600"></i>',
  };
  return iconMap[id] || '<i class="ri-loader-line text-base text-purple-600"></i>';
}

// 更新使用统计
async function updateUsageStats() {
  try {
    let totalUses = 0;
    let thisMonth = 0;
    let toolsUsed = 0;
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      // 获取工具使用统计
      const usageResult = await chrome.storage.local.get('toolUsageStats');
      if (usageResult.toolUsageStats) {
        const stats = usageResult.toolUsageStats;
        toolsUsed = Object.keys(stats).length;
        
        // 计算总使用次数
        totalUses = Object.values(stats).reduce((sum, count) => sum + count, 0);
      }
      
      // 计算本月使用次数
      const historyResult = await chrome.storage.local.get('usageHistory');
      if (historyResult.usageHistory && Array.isArray(historyResult.usageHistory)) {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        thisMonth = historyResult.usageHistory.filter(item => {
          const itemDate = new Date(item.timestamp);
          return itemDate >= thisMonthStart;
        }).length;
      }
    }
    
    // 不使用默认数据，直接显示实际统计结果
    
    document.getElementById('total-uses').textContent = totalUses;
    document.getElementById('this-month').textContent = thisMonth;
    document.getElementById('tools-used').textContent = toolsUsed;
    
  } catch (error) {
    console.error('更新统计失败:', error);
  }
}