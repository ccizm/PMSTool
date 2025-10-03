// 时钟报时器核心功能实现

import { initDatePicker, showModal } from '../main.js';

// 生成唯一ID函数
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// 初始化设置
const Settings = {
    timeEnabled: true,
    timePeriod: 60, // 默认1小时
    timeVoiceNotify: true,
    timeSystemNotify: true,
    showSeconds: true,
    showDate: true,
    // 删除时钟类型设置，默认为数字时钟
    hour12: false, // 默认24小时制
    reminders: []
};

// DOM元素
const digitalClock = document.getElementById('digitalClock');
const dateDisplay = document.getElementById('dateDisplay');
// 删除analogClock变量
const enableAlarm = document.getElementById('enableAlarm');
const voiceNotify = document.getElementById('voiceNotify');
const systemNotify = document.getElementById('systemNotify');
const showSeconds = document.getElementById('showSeconds');
const showDate = document.getElementById('showDate');
// 删除clockTypeRadios变量
const intervalRadios = document.querySelectorAll('input[name="alarmInterval"]');
const reminderList = document.getElementById('reminderList');
const addReminderBtn = document.getElementById('addReminder');

// 模态框元素
const reminderModal = document.getElementById('reminderModal');
const closeReminderModal = document.getElementById('closeReminderModal');
const cancelReminder = document.getElementById('cancelReminder');
const saveReminder = document.getElementById('saveReminder');
const reminderTime = document.getElementById('reminderTime');
const reminderText = document.getElementById('reminderText');
const reminderTypeRadios = document.querySelectorAll('input[name="reminderType"]');

// 初始化
async function init() {
    try {
        // 确保设置加载完成
        await loadSettings();

        // 更新UI显示
        updateUIFromSettings();

        // 启动时钟更新
        updateClock();
        setInterval(updateClock, 1000);

        // 注册事件监听器
        registerEventListeners();

        // 检查并启动报时定时器
        if (Settings.timeEnabled) {
            startAlarmTimer();
        }

        // 加载并显示提醒
        loadAndDisplayReminders();

        // 初始化时间选择器
        try {
            initDatePicker('reminderTime', {
                type: 'time', // 只选择时间
                format: 'HH:mm', // 只显示时间格式
                value: function () {
                    const now = new Date();
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    return `${hours}:${minutes}`;
                }(),
                choose: function (dates) {
                    // 可选的回调函数
                    console.log('选择的时间:', dates);
                }
            });
        } catch (error) {
            console.error('初始化时间选择器失败:', error);
        }
    } catch (error) {
        console.error('初始化失败:', error);
    }
}

// 加载设置
function loadSettings() {
    return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get('newclockSettings', (result) => {
                // 初始化Settings对象
                if (result.newclockSettings) {
                    Object.assign(Settings, result.newclockSettings);
                }

                // 确保reminders数组存在
                if (!Settings.reminders) {
                    Settings.reminders = [];
                }

                console.log('加载的提醒事项数量:', Settings.reminders.length);
                resolve();
            });
        } else {
            // 非Chrome环境下不添加默认提醒
            resolve();
        }
    });
}

// 保存设置
function saveSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({
            'newclockSettings': Settings
        }, () => {
            if (chrome.runtime.lastError) {
                console.warn('保存到chrome.storage失败:', chrome.runtime.lastError);
            }
        });
    }
}

// 从设置更新UI
function updateUIFromSettings() {
    enableAlarm.checked = Settings.timeEnabled;
    voiceNotify.checked = Settings.timeVoiceNotify;
    systemNotify.checked = Settings.timeSystemNotify;
    showSeconds.checked = Settings.showSeconds;
    showDate.checked = Settings.showDate;

    // 删除时钟类型相关代码

    // 设置报时间隔
    for (const radio of intervalRadios) {
        if (parseInt(radio.value) === Settings.timePeriod) {
            radio.checked = true;
        }
    }

    // 更新日期显示
    updateDateDisplay();
}

// 注册事件监听器
function registerEventListeners() {
    enableAlarm.addEventListener('change', function () {
        Settings.timeEnabled = this.checked;
        saveSettings();
        if (this.checked) {
            startAlarmTimer();
        } else {
            stopAlarmTimer();
        }
    });

    voiceNotify.addEventListener('change', function () {
        Settings.timeVoiceNotify = this.checked;
        saveSettings();
    });

    systemNotify.addEventListener('change', function () {
        Settings.timeSystemNotify = this.checked;
        saveSettings();
    });

    showSeconds.addEventListener('change', function () {
        Settings.showSeconds = this.checked;
        saveSettings();
        updateClock();
    });

    showDate.addEventListener('change', function () {
        Settings.showDate = this.checked;
        saveSettings();
        updateDateDisplay();
    });

    // 删除时钟类型相关的事件监听器

    for (const radio of intervalRadios) {
        radio.addEventListener('change', function () {
            if (this.checked) {
                Settings.timePeriod = parseInt(this.value);
                saveSettings();
                if (Settings.timeEnabled) {
                    startAlarmTimer();
                }
            }
        });
    }

    addReminderBtn.addEventListener('click', function () {
        // 打开模态框前设置默认时间为当前时间
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const defaultTime = `${hours}:${minutes}`;
        reminderTime.value = defaultTime;
        reminderText.value = '';

        // 确保默认提醒类型为"仅一次"
        const onceOption = Array.from(reminderTypeRadios).find(radio => radio.value === 'once');
        if (onceOption) {
            onceOption.checked = true;
        }

        // 显示模态框
        reminderModal.classList.remove('hidden');
        reminderModal.classList.add('flex');
    });

    // 关闭模态框
    closeReminderModal.addEventListener('click', function () {
        reminderModal.classList.add('hidden');
        reminderModal.classList.remove('flex');
    });

    // 取消添加提醒
    cancelReminder.addEventListener('click', function () {
        reminderModal.classList.add('hidden');
        reminderModal.classList.remove('flex');
    });

    // 保存提醒
    saveReminder.addEventListener('click', function () {
        const text = reminderText.value.trim();
        const timeStr = reminderTime.value;

        if (!text) {
            showModal('错误', '请输入提醒内容');
            return;
        }

        if (!timeStr) {
            showModal('错误', '请选择提醒时间');
            return;
        }

        // 获取提醒类型
        const reminderType = Array.from(reminderTypeRadios).find(radio => radio.checked)?.value || 'once';

        // 创建今天的日期对象
        const today = new Date();

        // 解析选择的时间并验证格式
        const timeParts = timeStr.split(':');
        if (timeParts.length !== 2) {
            showModal('错误', '请提供有效的时间格式（HH:mm）');
            return;
        }

        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);

        // 验证时间值是否有效
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            showModal('错误', '请提供有效的时间值');
            return;
        }

        // 创建提醒时间对象
        const reminderTimeObj = new Date(today);
        reminderTimeObj.setHours(hours, minutes, 0, 0);

        // 如果是仅一次提醒，并且选择的时间已过，则设置为明天
        if (reminderType === 'once' && reminderTimeObj <= today) {
            reminderTimeObj.setDate(reminderTimeObj.getDate() + 1);
        }

        // 如果是每天提醒，只需要保存时间部分，日期将在setReminderAlarm中动态处理
        const newReminder = {
            id: Date.now().toString(),
            time: reminderTimeObj.toISOString(),
            text: text,
            type: reminderType // 'once' 或 'daily'
        };

        Settings.reminders.push(newReminder);
        saveSettings();
        loadAndDisplayReminders();

        // 不需要在这里设置提醒，由background.js自动处理
        console.log('提醒已保存，将由background.js处理');

        // 明确通知background.js更新提醒设置
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ action: 'updateReminders' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('发送更新提醒消息失败:', chrome.runtime.lastError);
                } else {
                    console.log('已通知background.js更新提醒');
                }
            });
        }

        // 关闭模态框
        reminderModal.classList.add('hidden');
        reminderModal.classList.remove('flex');
    });

    // 点击模态框背景关闭
    reminderModal.addEventListener('click', function (event) {
        if (event.target === reminderModal) {
            reminderModal.classList.add('hidden');
            reminderModal.classList.remove('flex');
        }
    });
}

// 更新时钟显示
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    // 格式化时间
    if (Settings.hour12) {
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 转为 12
    }

    const hoursStr = hours.toString().padStart(2, '0');
    const minutesStr = minutes.toString().padStart(2, '0');
    const secondsStr = seconds.toString().padStart(2, '0');

    if (Settings.showSeconds) {
        digitalClock.textContent = `${hoursStr}:${minutesStr}:${secondsStr}`;
    } else {
        digitalClock.textContent = `${hoursStr}:${minutesStr}`;
    }

    // 移除对模拟时钟的更新
}

// 删除updateAnalogClock函数

// 更新日期显示
function updateDateDisplay() {
    if (Settings.showDate) {
        const now = new Date();
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        };
        dateDisplay.textContent = now.toLocaleDateString('zh-CN', options);
        dateDisplay.style.display = 'block';
    } else {
        dateDisplay.style.display = 'none';
    }
}

// 删除updateClockDisplayType函数

// 报时功能
let alarmTimer = null;

function startAlarmTimer() {
    // 清除现有定时器
    stopAlarmTimer();

    // 计算下一次报时时间
    const now = new Date();
    let nextAlarmTime = new Date(now);

    if (Settings.timePeriod < 60) {
        // 分钟级别的间隔
        const minutes = now.getMinutes();
        const nextMinutes = Math.ceil(minutes / Settings.timePeriod) * Settings.timePeriod;
        if (nextMinutes === minutes) {
            nextAlarmTime.setMinutes(minutes + Settings.timePeriod);
        } else {
            nextAlarmTime.setMinutes(nextMinutes);
        }
        nextAlarmTime.setSeconds(0);
    } else {
        // 小时级别的间隔
        const hours = now.getHours();
        const hoursInterval = Settings.timePeriod / 60;
        const nextHours = Math.ceil(hours / hoursInterval) * hoursInterval;
        if (nextHours === hours) {
            nextAlarmTime.setHours(hours + hoursInterval);
        } else {
            nextAlarmTime.setHours(nextHours);
        }
        nextAlarmTime.setMinutes(0);
        nextAlarmTime.setSeconds(0);
    }

    // 计算时间差
    const timeUntilAlarm = nextAlarmTime - now;

    // 如果计算的时间差太短，增加一个间隔
    if (timeUntilAlarm < 60000) {
        nextAlarmTime.setTime(nextAlarmTime.getTime() + Settings.timePeriod * 60000);
    }

    // 设置定时器
    alarmTimer = setTimeout(function () {
        performAlarm();
        // 循环设置下一次报时
        startAlarmTimer();
    }, timeUntilAlarm);

    console.log(`下一次报时: ${nextAlarmTime.toLocaleString()}`);
}

function stopAlarmTimer() {
    if (alarmTimer) {
        clearTimeout(alarmTimer);
        alarmTimer = null;
    }
}

function performAlarm() {
    const now = new Date();

    // 语音报时
    if (Settings.timeVoiceNotify) {
        speakTime(now);
    }

    // 系统通知
    if (Settings.timeSystemNotify) {
        showNotification(now);
    }
}

function speakTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    let message = '';

    if (Settings.hour12) {
        const period = hours >= 12 ? '下午' : '上午';
        const hour12 = hours % 12 || 12;
        message = `${period}${hour12}点${minutes}分`;
    } else {
        message = `${hours}点${minutes}分`;
    }

    // 检查浏览器是否支持语音合成
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'zh-CN';
        speechSynthesis.speak(utterance);
    }
}

function showNotification(date) {
    // 检查浏览器是否支持通知
    if ('Notification' in window) {
        // 请求通知权限
        if (Notification.permission === 'granted') {
            const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            new Notification('时钟报时器', {
                body: `现在是${timeStr}`,
                icon: '/static/remind.svg'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(function (permission) {
                if (permission === 'granted') {
                    showNotification(date);
                }
            });
        }
    }
}

import { getSortedTodayReminders, createReminderItemElement, showEmptyReminderMessage } from '../reminderUtils.js';

// 提醒功能
function loadAndDisplayReminders() {
    reminderList.innerHTML = '';

    console.log('显示提醒事项列表，总数:', Settings.reminders.length);

    // 获取今天的提醒并排序
    const todayReminders = getSortedTodayReminders(Settings.reminders);

    console.log('今天的提醒事项数量:', todayReminders.length);

    if (todayReminders.length === 0) {
        showEmptyReminderMessage(reminderList, { message: '暂无提醒事项' });
        return;
    }

    todayReminders.forEach(reminder => {
        // 直接使用导入的函数创建提醒项
        const reminderItem = createReminderItemElement(reminder, {
            onDelete: deleteReminder,
            showDivider: false,
            smallText: false
        });
        reminderList.appendChild(reminderItem);
    });
}

// 原有的addReminder函数已被模态框实现替代

function deleteReminder(reminderId) {
    Settings.reminders = Settings.reminders.filter(reminder => reminder.id !== reminderId);
    saveSettings();
    loadAndDisplayReminders();

    // 通过保存设置让background.js知道需要更新闹钟
    console.log('提醒已删除，background.js将更新闹钟');
}

function setReminderAlarm(reminder) {
    const reminderTime = new Date(reminder.time);
    const now = new Date();

    // 调整提醒时间到今天或明天
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reminderDate = new Date(reminderTime);
    reminderDate.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());

    // 如果今天的提醒时间已过，则设置为明天
    if (reminderDate <= now) {
        reminderDate.setDate(reminderDate.getDate() + 1);
    }

    const timeUntilReminder = reminderDate - now;

    if (timeUntilReminder > 0) {
        setTimeout(function () {
            showReminderNotification(reminder);

            // 如果是每天提醒，设置明天的提醒
            if (reminder.type === 'daily') {
                setReminderAlarm(reminder);
            }
        }, timeUntilReminder);
    }
}

function clearReminderAlarm(reminderId) {
    // 在实际应用中，可能需要一个映射来跟踪所有活跃的提醒定时器
    // 这里简化处理
}

// 前端备用的提醒通知函数（如果页面打开时需要显示通知）
function showReminderNotification(reminder) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('提醒', {
            body: reminder.text,
            icon: '/static/remind.svg'
        });
    }

    // 同时进行语音提醒
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`提醒：${reminder.text}`);
        utterance.lang = 'zh-CN';
        speechSynthesis.speak(utterance);
    }
}

// 监听background.js发送的消息
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // 处理提醒消息
        if (message.action === 'showReminder') {
            console.log('收到来自background.js的提醒消息:', message.reminder);
            showReminderNotification(message.reminder);
        }
        // 处理报时消息
        else if (message.action === 'performAlarm') {
            console.log('收到来自background.js的报时消息:', message.time);
            // 检查是否启用了语音报时
            if (Settings && Settings.timeVoiceNotify) {
                speakTime(new Date(message.time));
            }
            // 系统通知已由background.js处理
        }
        // 更新提醒列表
        else if (message.action === 'updateRemindersLocalStorage') {
            console.log('收到更新提醒列表的请求');
            // 更新Settings对象
            Settings.reminders = message.reminders;
            // 刷新UI显示
            loadAndDisplayReminders();
            // 同时保存到chrome.storage.local
            saveSettings();
        }
    });
}

// 监听chrome.storage.local变化，用于不同标签页之间的同步
if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.newclockSettings) {
            const newSettings = changes.newclockSettings.newValue;
            Object.assign(Settings, newSettings);
            updateUIFromSettings();
            loadAndDisplayReminders();
        }
    });
}

// 初始化应用
init();