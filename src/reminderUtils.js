/**
 * 提醒功能的共享工具函数
 */

/**
 * 获取今天的提醒并按类型和时间排序
 * @param {Array} reminders - 所有提醒列表
 * @returns {Array} 排序后的今日提醒列表
 */
export function getSortedTodayReminders(reminders) {
    const today = new Date();
    const todayStr = today.toDateString();
    
    // 如果reminders未定义或为空数组，返回空数组
    if (!reminders || reminders.length === 0) {
        return [];
    }
    
    // 过滤今日提醒和每日提醒(daily)
    return reminders.filter(reminder => {
        // 每日提醒(daily)始终显示
        if (reminder.type === 'daily') {
            return true;
        }
        // 非每日提醒只在当天显示
        const reminderDate = new Date(reminder.time);
        return reminderDate.toDateString() === todayStr;
    }).sort((a, b) => {
        // 获取提醒的时间（不考虑日期）
        const getTimeOnly = (dateStr) => {
            const date = new Date(dateStr);
            // 从ISO字符串中提取时间部分
            if (dateStr.includes('T')) {
                const timePart = dateStr.split('T')[1].split('.')[0];
                const [hours, minutes, seconds] = timePart.split(':').map(Number);
                const todayDate = new Date(today);
                todayDate.setHours(hours, minutes, seconds, 0);
                return todayDate;
            }
            return date;
        };
        
        // 先按时间从早到晚排序
        const timeA = getTimeOnly(a.time);
        const timeB = getTimeOnly(b.time);
        return timeA - timeB;
    });
}

/**
 * 格式化提醒时间
 * @param {Date} reminderDate - 提醒时间
 * @returns {string} 格式化后的时间字符串 (HH:MM)
 */
export function formatReminderTime(reminderDate) {
    return reminderDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * 创建提醒项元素
 * @param {Object} reminder - 提醒对象
 * @param {Object} options - 配置选项
 * @param {Function} options.onDelete - 删除回调函数（可选）
 * @param {boolean} options.showDivider - 是否显示分割线（可选）
 * @param {boolean} options.smallText - 是否使用小字体（可选）
 * @returns {HTMLElement} 提醒项元素
 */
export function createReminderItemElement(reminder, options = {}) {
    const {
        onDelete = null,
        showDivider = false,
        smallText = false
    } = options;
    
    const item = document.createElement('div');
    item.className = smallText 
        ? 'flex items-center justify-between p-1 hover:bg-blue-50 rounded-lg transition-all shadow-sm border-l-4 border-transparent'
        : 'flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition-colors';
    
    const reminderDate = new Date(reminder.time);
    const timeStr = formatReminderTime(reminderDate);
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'flex flex-col' + (smallText ? ' w-full' : '');
    
    const timeTypeContainer = document.createElement('div');
    timeTypeContainer.className = 'flex items-center gap-2';
    
    const timeSpan = document.createElement('span');
    timeSpan.className = smallText 
        ? 'text-xs font-semibold'
        : 'text-sm font-medium';
    
    // 根据提醒类型显示不同的时间前缀和颜色
    if (reminder.type === 'daily') {
        if (smallText) {
            timeSpan.classList.add('text-green-600');
        } else {
            timeSpan.className = 'text-sm font-medium text-green-600';
        }
        timeSpan.textContent = `每天：${timeStr}`;
        timeTypeContainer.appendChild(timeSpan);
    } else {
        if (smallText) {
            timeSpan.classList.add('text-blue-600');
        } else {
            timeSpan.className = 'text-sm font-medium text-blue-600';
        }
        timeSpan.textContent = `今日：${timeStr}`;
        timeTypeContainer.appendChild(timeSpan);
    }
    
    const textSpan = document.createElement('span');
    textSpan.className = smallText 
        ? 'text-sm text-gray-700'
        : 'text-sm text-gray-600';
    textSpan.textContent = reminder.text;
    
    contentContainer.appendChild(timeTypeContainer);
    contentContainer.appendChild(textSpan);
    
    item.appendChild(contentContainer);
    
    // 如果有删除回调，添加删除按钮
    if (typeof onDelete === 'function') {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '删除';
        deleteBtn.className = 'px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors';
        deleteBtn.addEventListener('click', function() {
            onDelete(reminder.id);
        });
        
        item.appendChild(deleteBtn);
    }
    
    return item;
}

/**
 * 显示空提醒列表消息
 * @param {HTMLElement} container - 容器元素
 * @param {Object} options - 配置选项
 * @param {string} options.message - 显示的消息文本
 * @param {boolean} options.smallPadding - 是否使用小内边距
 */
export function showEmptyReminderMessage(container, options = {}) {
    const {
        message = '暂无提醒事项',
        smallPadding = false
    } = options;
    
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'text-center text-gray-500 ' + (smallPadding ? 'py-4' : 'py-6');
    emptyMsg.innerHTML = message;
    container.appendChild(emptyMsg);
}