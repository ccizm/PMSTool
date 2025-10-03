// 后台服务工作线程
console.log('Background service worker loaded');

// 扩展安装时的处理
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');

  // 初始化时注册已保存的提醒（如果有）
  registerAllReminders();
});

// 服务工作线程启动时检查过期提醒
chrome.runtime.onStartup.addListener(() => {
  console.log('Background service worker started, checking for expired reminders');
  // 检查并清理过期提醒
  cleanupExpiredReminders();
  // 注册所有有效提醒
  registerAllReminders();
});



// 监听来自前台页面的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('收到消息:', message);

  if (message.action === 'updateReminders') {
    console.log('收到更新提醒请求，重新注册所有提醒');
    registerAllReminders();
    sendResponse({ success: true });
  }

  // 确保返回true以支持异步响应
  return true;
});

// 监听通知点击或关闭事件
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('通知被点击:', notificationId);
  // 关闭通知
  chrome.notifications.clear(notificationId);
});

chrome.notifications.onClosed.addListener((notificationId, byUser) => {
  console.log(`通知被关闭: ${notificationId}, 用户操作: ${byUser}`);
  // 如果是用户关闭的通知，可以在这里添加额外处理
});

// 原有onInstalled代码已移至文件顶部，并增强了初始化默认提醒的功能

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked', tab);
});

// 监听存储变化，用于检测提醒更新
chrome.storage.local.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.newclockSettings) {
    console.log('检测到newclock设置变化，更新提醒');
    registerAllReminders();
  }
});

// 检查并清理过期提醒
function cleanupExpiredReminders() {
  chrome.storage.local.get(['newclockSettings'], (result) => {
    const newclockSettings = result.newclockSettings || {};
    const reminders = (newclockSettings.reminders || []);
    
    const now = new Date().getTime();
    console.log(`开始清理过期提醒 - 总提醒数: ${reminders.length}`);
    
    let validReminders = [];
    let expiredRemindersCount = 0;
    
    try {
      // 遍历所有提醒，过滤过期的一次性提醒
      reminders.forEach(reminder => {
        try {
          if (!reminder || !reminder.time) {
            console.warn('跳过无效提醒:', reminder);
            return;
          }
          
          // 检查是否是一次性提醒且已过期
          if (reminder.type === 'once') {
            try {
              const reminderTime = new Date(reminder.time).getTime();
              // 允许有10分钟的误差，避免因时区或系统时间问题导致误删
              const validityThreshold = now - 10 * 60 * 1000; // 10分钟前
              const isValid = reminderTime > validityThreshold;
              
              if (!isValid) {
                expiredRemindersCount++;
                console.log(`标记为过期的一次性提醒: ID=${reminder.id}, 内容: ${reminder.text}, 时间: ${new Date(reminder.time).toLocaleString()}`);
              } else {
                validReminders.push(reminder);
              }
            } catch (timeError) {
              console.error('解析提醒时间出错:', reminder.id || '未知ID', timeError);
              // 时间解析错误时，假设提醒有效并保留
              validReminders.push(reminder);
            }
          } else {
            // 保留所有非一次性提醒（如每日提醒）
            validReminders.push(reminder);
          }
        } catch (error) {
          console.error('处理提醒时出错:', reminder.id || '未知ID', error);
          // 出错时仍然保留提醒，以免意外丢失数据
          validReminders.push(reminder);
        }
      });
      
      // 如果有过期的提醒被过滤掉，更新存储
      if (expiredRemindersCount > 0) {
        try {
          // 确保newclockSettings对象存在
          if (!newclockSettings) {
            newclockSettings = { reminders: [] };
          }
          
          // 更新newclockSettings对象中的reminders数组
          newclockSettings.reminders = validReminders;
          
          console.log(`准备将${validReminders.length}个有效提醒保存到存储`);
          
          chrome.storage.local.set({ newclockSettings: newclockSettings }, () => {
            if (chrome.runtime.lastError) {
              console.error('更新存储失败:', chrome.runtime.lastError);
            } else {
              console.log(`已成功清理${expiredRemindersCount}个过期的一次性提醒，并更新newclockSettings`);
              // 通知前端更新
              notifyFrontendOfRemindersUpdate(validReminders);
            }
          });
        } catch (error) {
          console.error('更新过期提醒列表时发生错误:', error);
        }
      }
    } catch (error) {
      console.error('清理过期提醒时发生严重错误:', error);
    }
    
    console.log(`清理过期提醒完成 - 剩余有效提醒数: ${validReminders.length}`);
  });
}

// 注册所有提醒到Chrome alarms
function registerAllReminders() {
  // 从存储中获取所有提醒
  chrome.storage.local.get(['newclockSettings'], (result) => {
    const newclockSettings = result.newclockSettings || {};
    const reminders = (newclockSettings.reminders || []);

    // 设置免打扰功能的默认值（如果不存在）
    const defaultDndSettings = {
      timeDndLocked: true,     // 屏幕锁定时免打扰
      timeDndAudible: true,    // 有声音标签页时免打扰
      timeDndFullscreen: true  // 有全屏窗口时免打扰
    };

    // 合并默认设置
    const mergedSettings = { ...defaultDndSettings, ...newclockSettings };

    // 如果设置发生变化，保存更新后的设置
    if (!isEqual(newclockSettings, mergedSettings)) {
      chrome.storage.local.set({ newclockSettings: mergedSettings }, () => {
        console.log('已更新newclock设置，添加了默认的免打扰配置');
      });
    }

    // 清除所有现有的闹钟
    chrome.alarms.clearAll(() => {
      if (chrome.runtime.lastError) {
        console.error('清除所有闹钟失败:', chrome.runtime.lastError);
      } else {
        console.log('已清除所有现有闹钟');
      }

      // 过滤掉已经过期的一次性提醒
      const now = new Date().getTime();
      console.log(`注册所有提醒前 - 总提醒数: ${reminders.length}`);

      let validReminders = [];
      const expiredReminders = [];
      
      try {
        // 遍历所有提醒，过滤过期的一次性提醒
        reminders.forEach(reminder => {
          try {
            if (!reminder || !reminder.time) {
              console.warn('跳过无效提醒:', reminder);
              return;
            }
            
            // 检查是否是一次性提醒且已过期
            if (reminder.type === 'once') {
              try {
                const reminderTime = new Date(reminder.time).getTime();
                // 允许有10分钟的误差，避免因时区或系统时间问题导致误删
                const validityThreshold = now - 10 * 60 * 1000; // 10分钟前
                const isValid = reminderTime > validityThreshold;
                
                if (!isValid) {
                  expiredReminders.push(reminder);
                  console.log(`过滤掉过期的一次性提醒: ID=${reminder.id}, 内容: ${reminder.text}, 时间: ${new Date(reminder.time).toLocaleString()}`);
                } else {
                  validReminders.push(reminder);
                }
              } catch (timeError) {
                console.error('解析提醒时间出错:', reminder.id || '未知ID', timeError);
                // 时间解析错误时，假设提醒有效并保留
                validReminders.push(reminder);
              }
            } else {
              // 保留所有非一次性提醒（如每日提醒）
              validReminders.push(reminder);
            }
          } catch (error) {
            console.error('处理提醒时出错:', reminder.id || '未知ID', error);
            // 出错时仍然保留提醒，以免意外丢失数据
            validReminders.push(reminder);
          }
        });
        
        // 如果有过期的提醒被过滤掉，更新存储
        if (expiredReminders.length > 0) {
          try {
            // 确保newclockSettings对象存在
            if (!newclockSettings) {
              newclockSettings = { reminders: [] };
            }
            
            // 更新newclockSettings对象中的reminders数组
            newclockSettings.reminders = validReminders;
            
            console.log(`准备将${validReminders.length}个有效提醒保存到存储`);
            
            chrome.storage.local.set({ newclockSettings: newclockSettings }, () => {
              if (chrome.runtime.lastError) {
                console.error('更新存储失败:', chrome.runtime.lastError);
                // 即使存储更新失败，也要尝试重新注册提醒
                setTimeout(() => {
                  registerAllReminders();
                }, 1000);
              } else {
                console.log(`已成功过滤掉${expiredReminders.length}个过期的一次性提醒，并更新newclockSettings`);
                // 通知前端更新
                notifyFrontendOfRemindersUpdate(validReminders);
              }
            });
          } catch (error) {
            console.error('更新过期提醒列表时发生错误:', error);
            // 出错时尝试重新注册提醒
            setTimeout(() => {
              registerAllReminders();
            }, 1000);
          }
        }
      } catch (error) {
        console.error('过滤过期提醒时发生严重错误:', error);
        // 出错时使用原始提醒列表，确保功能不中断
        validReminders = [...reminders];
      }

      // 为每个有效提醒设置新的闹钟
      validReminders.forEach(reminder => {
        scheduleReminder(reminder);
      });

      console.log(`已重新安排${validReminders.length}个有效提醒`);

      // 如果有报时功能，重新设置
      if (mergedSettings.timeVoiceNotify || mergedSettings.timeSystemNotify) {
        scheduleAlarmClock();
      }
    });
  });
}

// 简单的对象比较函数
function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// 更新提醒存储，带重试机制
function updateRemindersStorageWithRetry(settings, maxRetries, onSuccess) {
  let retries = 0;
  
  function attemptUpdate() {
    chrome.storage.local.set({ newclockSettings: settings }, () => {
      if (chrome.runtime.lastError) {
        retries++;
        console.error(`更新存储失败(尝试${retries}/${maxRetries}):`, chrome.runtime.lastError);
        
        if (retries < maxRetries) {
          // 指数退避重试
          const delay = Math.pow(2, retries - 1) * 500; // 500ms, 1000ms, 2000ms...
          console.log(`将在${delay}ms后重试...`);
          setTimeout(attemptUpdate, delay);
        } else {
          console.error(`已达到最大重试次数(${maxRetries})，存储更新失败`);
          // 即使最终失败，也要尝试重新注册提醒
          setTimeout(() => {
            registerAllReminders();
          }, 1000);
        }
      } else {
        console.log('存储更新成功');
        if (onSuccess) {
          onSuccess();
        }
      }
    });
  }
  
  attemptUpdate();
}

// 通知前端更新提醒列表
function notifyFrontendOfRemindersUpdate(reminders) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes('newclock')) {
        try {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateRemindersLocalStorage',
            reminders: reminders
          });
          console.log('已发送更新提醒列表消息到标签页:', tab.id);
        } catch (error) {
          console.warn('发送更新提醒列表消息失败:', tab.id, error);
        }
      }
    });
  });
}

// 安排单个提醒
function scheduleReminder(reminder) {
  try {
    const reminderTime = new Date(reminder.time);
    const now = new Date();
    console.log(`安排提醒: ${reminder.text}, 类型: ${reminder.type}, 时间: ${reminderTime.toLocaleString()}`);

    // 调整提醒时间到今天或明天
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alarmTime = new Date(today);
    // 只使用原始提醒的时和分
    alarmTime.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0);

    // 如果今天的提醒时间已过，则设置为明天
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
      console.log(`今天的提醒时间已过，设置为明天: ${alarmTime.toLocaleString()}`);
    }

    // 计算距离提醒触发的时间（毫秒）
    const delayInMinutes = Math.round((alarmTime.getTime() - now.getTime()) / (1000 * 60));

    // 创建Chrome闹钟
    const alarmOptions = {
      delayInMinutes: delayInMinutes
    };

    // 如果是每天提醒，设置重复周期
    if (reminder.type === 'daily') {
      alarmOptions.periodInMinutes = 1440; // 每天（1440分钟=24小时）
      console.log(`设置为每日提醒，重复周期: 1440分钟`);
    }

    // 使用提醒ID作为闹钟名称
    chrome.alarms.create(`reminder_${reminder.id}`, alarmOptions);

    console.log(`已安排提醒: ${reminder.text}, 将在${delayInMinutes}分钟后触发，闹钟名称: reminder_${reminder.id}`);
  } catch (error) {
    console.error('安排提醒失败:', error);
  }
}

// 安排报时闹钟
function scheduleAlarmClock() {
  chrome.storage.local.get('newclockSettings', (result) => {
    if (result.newclockSettings && result.newclockSettings.timeEnabled) {
      const settings = result.newclockSettings;
      const timePeriod = settings.timePeriod || 60; // 默认60分钟

      const now = new Date();
      let nextAlarmTime = new Date(now);

      if (timePeriod < 60) {
        // 分钟级别的间隔
        const minutes = now.getMinutes();
        const nextMinutes = Math.ceil(minutes / timePeriod) * timePeriod;
        if (nextMinutes === minutes) {
          nextAlarmTime.setMinutes(minutes + timePeriod);
        } else {
          nextAlarmTime.setMinutes(nextMinutes);
        }
        nextAlarmTime.setSeconds(0);
      } else {
        // 小时级别的间隔
        const hours = now.getHours();
        const hoursInterval = timePeriod / 60;
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
        nextAlarmTime.setTime(nextAlarmTime.getTime() + timePeriod * 60000);
      }

      // 计算延迟分钟数
      const delayInMinutes = Math.round((nextAlarmTime.getTime() - now.getTime()) / (1000 * 60));

      // 创建Chrome闹钟，设置为重复
      chrome.alarms.create('alarm_clock', {
        delayInMinutes: delayInMinutes,
        periodInMinutes: timePeriod
      });

      console.log(`已安排报时: 间隔${timePeriod}分钟，下次报时${nextAlarmTime.toLocaleString()}`);
    }
  });
}

// 在后台直接执行语音报时 - 使用Chrome扩展专用tts API
function speakTimeInBackground(date, settings) {
  try {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    let message = '';

    if (settings.hour12) {
      const period = hours >= 12 ? '下午' : '上午';
      const hour12 = hours % 12 || 12;
      message = `${period}${hour12}点${minutes}分`;
    } else {
      message = `${hours}点${minutes}分`;
    }

    // 检查Chrome TTS API是否可用
    if (chrome && chrome.tts) {
      // 使用Chrome扩展专用tts API，更适合在Service Worker环境中使用
      chrome.tts.speak(message, {
        lang: 'zh-CN',
        enqueue: true
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Chrome TTS报时失败:', chrome.runtime.lastError);
        } else {
          console.log('在后台执行Chrome TTS语音报时:', message);
        }
      });
    } else {
      console.log('当前环境不支持Chrome TTS API');
    }
  } catch (error) {
    console.error('后台语音报时失败:', error);
  }
}

// 免打扰检查函数
function checkDoNotDisturb(settings, callback) {
  // 初始化检查状态
  let isLocked = false;
  let hasAudibleTabs = false;
  let hasFullscreenWindows = false;
  let checksDone = 0;
  const totalChecks = 3;

  // 检查屏幕锁定状态
  chrome.idle.queryState(300, (state) => {
    isLocked = state === 'locked';
    checkCompletion();
  });

  // 检查是否有声音的标签页
  chrome.tabs.query({ audible: true, muted: false }, (tabs) => {
    hasAudibleTabs = tabs.length > 0;
    checkCompletion();
  });

  // 检查是否有全屏窗口
  chrome.windows.getAll((windows) => {
    hasFullscreenWindows = windows.some(window => window.state === 'fullscreen');
    checkCompletion();
  });

  // 所有检查完成后调用回调
  function checkCompletion() {
    checksDone++;
    if (checksDone === totalChecks) {
      // 确定是否应该免打扰
      const shouldDnd =
        (settings.timeDndLocked && isLocked) ||
        (settings.timeDndAudible && hasAudibleTabs) ||
        (settings.timeDndFullscreen && hasFullscreenWindows);

      callback(shouldDnd, { isLocked, hasAudibleTabs, hasFullscreenWindows });
    }
  }
}

// 处理报时
function performAlarmClock() {
  chrome.storage.local.get('newclockSettings', (result) => {
    if (result.newclockSettings) {
      const settings = result.newclockSettings;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

      // 检查是否应该免打扰
      checkDoNotDisturb(settings, (shouldDnd, dndStatus) => {
        console.log('免打扰检查结果:', { shouldDnd, ...dndStatus });

        if (!shouldDnd) {
          // 创建报时通知
          if (settings.timeSystemNotify) {
            chrome.notifications.create(`alarm_${Date.now()}`, {
              type: 'basic',
              title: '时钟报时器',
              message: `现在是${timeStr}`,
              iconUrl: '../static/remind.svg',
              requireInteraction: true
            }, (notificationId) => {
              if (chrome.runtime.lastError) {
                console.error('创建报时通知失败:', chrome.runtime.lastError);
              } else {
                console.log('已显示报时通知:', notificationId);
              }
            });
          }

          // 在后台直接执行语音报时（无论前端页面是否打开）
          if (settings.timeVoiceNotify) {
            speakTimeInBackground(now, settings);
          }

          // 向前端页面发送消息，以便处理前端的额外功能
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              // 检查标签页URL是否包含newclock页面
              if (tab.url && tab.url.includes('newclock')) {
                try {
                  chrome.tabs.sendMessage(tab.id, {
                    action: 'performAlarm',
                    time: now
                  });
                  console.log('已发送报时消息到标签页:', tab.id);
                } catch (error) {
                  console.warn('发送消息到标签页失败:', tab.id, error);
                }
              }
            });
          });
        } else {
          console.log('当前处于免打扰模式，跳过报时');
        }
      });
    }
  });
}

// 测试提醒功能 - 临时函数，用于验证修复是否成功
function testReminder() {
  console.log('创建测试提醒，将在1分钟后触发');
  const now = new Date();
  const testTime = new Date(now);
  testTime.setMinutes(testTime.getMinutes() + 1);

  // 获取现有的设置
  chrome.storage.local.get('newclockSettings', (result) => {
    const newclockSettings = result.newclockSettings || { reminders: [] };

    // 创建测试提醒
    const testReminder = {
      id: `test_${Date.now()}`,
      time: testTime.toISOString(),
      text: '测试提醒 - 这表示提醒功能已修复！',
      type: 'once'
    };

    // 添加到提醒列表
    newclockSettings.reminders.push(testReminder);

    // 保存更新后的设置
    chrome.storage.local.set({ newclockSettings }, () => {
      console.log('测试提醒已保存');

      // 立即注册所有提醒
      registerAllReminders();
    });
  });
}

// 暴露测试函数给调试使用
//testReminder(); // 注释掉这行，需要时取消注释

// 监听闹钟触发事件
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('闹钟触发:', alarm.name);

  // 检查是否是报时闹钟
  if (alarm.name === 'alarm_clock') {
    console.log('报时闹钟触发');
    performAlarmClock();
  }
  // 检查是否是提醒闹钟
  else if (alarm.name.startsWith('reminder_')) {
    const reminderId = alarm.name.replace('reminder_', '');
    console.log(`提醒闹钟触发: ID=${reminderId}`);

    // 获取提醒详情并显示通知
    chrome.storage.local.get('newclockSettings', (result) => {
      if (result.newclockSettings && result.newclockSettings.reminders) {
        console.log(`从存储中获取到的提醒总数: ${result.newclockSettings.reminders.length}`);
        const reminder = result.newclockSettings.reminders.find(r => r.id === reminderId);

        if (reminder) {
          console.log(`找到匹配的提醒: ${reminder.text}, 类型: ${reminder.type}`);
          showNotification(reminder);

          // 如果是一次性提醒，从存储中移除
          if (reminder.type === 'once') {
            try {
              // 获取当前所有提醒
              const updatedReminders = result.newclockSettings.reminders.filter(r => r.id !== reminderId);
              
              console.log(`删除前提醒数: ${result.newclockSettings.reminders.length}, 删除后提醒数: ${updatedReminders.length}`);

              // 更新存储中的提醒列表
              result.newclockSettings.reminders = updatedReminders;
                
              // 更新Chrome存储 - 尝试最多3次
              updateRemindersStorageWithRetry(result.newclockSettings, 3, () => {
                // 注册成功后的回调
                console.log('已成功删除已触发的一次性提醒并更新存储:', reminderId);
                
                // 通知前端更新
                notifyFrontendOfRemindersUpdate(updatedReminders);
                
                // 重新注册所有提醒，确保没有遗漏
                registerAllReminders();
              });
            } catch (error) {
              console.error('删除一次性提醒时发生错误:', error);
              // 即使出现错误，也要尝试重新注册提醒
              setTimeout(() => {
                registerAllReminders();
              }, 1000);
            }
          }
        }
      }
    });
  }
});

// 语音播报提醒内容 - 使用Chrome扩展专用tts API
function speakReminderText(reminderText) {
  try {
    // 检查Chrome TTS API是否可用
    if (chrome && chrome.tts) {
      // 使用Chrome扩展专用tts API，更适合在Service Worker环境中使用
      // 第一次播报
      chrome.tts.speak(`提醒事项：${reminderText}`, {
        lang: 'zh-CN',
        enqueue: true
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Chrome TTS语音播报第一次失败:', chrome.runtime.lastError);
        } else {
          console.log('已启动Chrome TTS语音播报提醒内容(第一次)');
          // 第二次播报
          setTimeout(() => {
            chrome.tts.speak(`提醒事项：${reminderText}`, {
              lang: 'zh-CN',
              enqueue: true
            }, () => {
              if (chrome.runtime.lastError) {
                console.error('Chrome TTS语音播报第二次失败:', chrome.runtime.lastError);
              } else {
                console.log('已启动Chrome TTS语音播报提醒内容(第二次)');
              }
            });
          }, 3000); // 延迟1秒进行第二次播报
        }
      });
    } else {
      console.log('当前环境不支持Chrome TTS API');
    }
  } catch (error) {
    console.error('语音播报失败:', error);
  }
}

// 显示通知 - 支持免打扰模式
function showNotification(reminder) {
  // 首先检查设置，获取免打扰配置
  chrome.storage.local.get('newclockSettings', (result) => {
    const settings = result.newclockSettings || {};

    // 检查是否应该免打扰
    checkDoNotDisturb(settings, (shouldDnd, dndStatus) => {
      console.log('提醒通知免打扰检查结果:', { shouldDnd, ...dndStatus });

      if (!shouldDnd) {
        try {
          // 创建系统通知
          chrome.notifications.create(`notification_${Date.now()}`, {
            type: 'basic',
            title: '提醒事项',
            message: reminder.text,
            iconUrl: '../static/remind.svg',
            requireInteraction: true // 保持通知可见直到用户关闭
          }, (notificationId) => {
            if (chrome.runtime.lastError) {
              console.error('创建通知失败:', chrome.runtime.lastError);
            } else {
              console.log('已显示通知:', notificationId);
              
              // 设置定时器，5分钟后自动关闭通知
              setTimeout(() => {
                try {
                  chrome.notifications.clear(notificationId, (wasCleared) => {
                    if (wasCleared) {
                      console.log(`通知${notificationId}已自动清除`);
                      // 通知清除后检查并删除一次性提醒
                      if (reminder.type === 'once') {
                        removeOneTimeReminder(reminder.id);
                      }
                    }
                  });
                } catch (clearError) {
                  console.error('清除通知失败:', clearError);
                }
              }, 5 * 60 * 1000); // 5分钟后自动清除
            }
          });

          // 尝试在background中直接进行语音播报
          speakReminderText(reminder.text);

          // 向前端页面发送消息，以便处理语音提醒等功能
          chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
              // 检查标签页URL是否包含newclock页面
              if (tab.url && tab.url.includes('newclock')) {
                try {
                  chrome.tabs.sendMessage(tab.id, {
                    action: 'showReminder',
                    reminder: reminder
                  });
                  console.log('已发送提醒消息到标签页:', tab.id);
                } catch (error) {
                  console.warn('发送消息到标签页失败:', tab.id, error);
                }
              }
            });
          });
        } catch (error) {
          console.error('显示通知失败:', error);
        }
      } else {
        console.log('当前处于免打扰模式，跳过提醒通知:', reminder.text);
      }
    });
  });
}

// 删除一次性提醒
function removeOneTimeReminder(reminderId) {
  try {
    chrome.storage.local.get('newclockSettings', (result) => {
      if (result.newclockSettings && result.newclockSettings.reminders) {
        // 过滤掉指定ID的提醒
        const updatedReminders = result.newclockSettings.reminders.filter(r => r.id !== reminderId);
        
        if (updatedReminders.length < result.newclockSettings.reminders.length) {
          console.log(`准备删除一次性提醒: ID=${reminderId}`);
          
          // 更新存储中的提醒列表
          const updatedSettings = { ...result.newclockSettings, reminders: updatedReminders };
            
          // 更新Chrome存储 - 尝试最多3次
          updateRemindersStorageWithRetry(updatedSettings, 3, () => {
            console.log('已成功删除一次性提醒并更新存储:', reminderId);
            // 通知前端更新
            notifyFrontendOfRemindersUpdate(updatedReminders);
          });
        }
      }
    });
  } catch (error) {
    console.error('删除一次性提醒时发生错误:', error);
  }
}
