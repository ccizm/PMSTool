/**
 * PMS工具设置页面脚本
 * 处理设置页面的交互逻辑和数据存储
 */

// 导入公共函数
import { getSettings, saveSettings, getDefaultSettings, showModal, showConfirmModal, initModal, options } from '../main.js'


// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
  console.log('PMS工具设置页面已加载');
  
  // 初始化标签页功能
  initTabs();
  
  // 初始化折叠面板
  initCollapsiblePanels();
  
  // 初始化模态框
  initModal();
  
  // 加载设置数据 - 使用Chrome存储获取设置
  chrome.storage.local.get('options', (data) => {
    // 将获取的数据合并到options对象
    if (data.options) {
      Object.assign(options, data.options);
    }
    
    // 保存到全局变量以便后续操作
    window.options = options;
    
    // 设置酒店信息表单
    document.getElementById('SetHotelName').value = options.Hotel[0].HotelName || '';
    document.getElementById('SetHotelAddress').value = options.Hotel[0].HotelAddress || '';
    document.getElementById('SetStaffAD').value = options.Staff[0].StaffName || '';
    document.getElementById('SetHotelPhone').value = options.Hotel[0].HotelPhone || '';
    document.getElementById('SetHotelNum').value = options.Hotel[0].HotelNumber || '';
    document.getElementById('SetHotelZip').value = options.Hotel[0].HotelZip || '';
    document.getElementById('SetHotelFax').value = options.Hotel[0].HotelFax || '';
    
    // 加载消费类型到表格
    if (options.Consumption && options.Consumption.length > 0) {
      const consumptionTable = document.getElementById('ConsumptionTable').querySelector('tbody');
      consumptionTable.innerHTML = '';
      
      options.Consumption.forEach(type => {
        addConsumptionTypeToTable(type);
      });
    }
    
    // 加载付款方式到表格
    if (options.Payment && options.Payment.length > 0) {
      const paymentTable = document.getElementById('PaymentTable').querySelector('tbody');
      paymentTable.innerHTML = '';
      
      options.Payment.forEach(type => {
        addPaymentTypeToTable(type);
      });
    }
    
    // 加载会员等级到表格
    if (options.Vip && options.Vip.length > 0) {
      const vipTable = document.getElementById('VipTable').querySelector('tbody');
      vipTable.innerHTML = '';
      
      options.Vip.forEach(vip => {
        addVipLevelToTable(vip);
      });
    }
    
    // 初始化常用信息
    initCommonInfo();
    
    // 确保AI设置对象存在
    if (!options.AI) {
      options.AI = getDefaultSettings().AI;
    }
    
    // 初始化AI设置
    initAISettings();
    
    // 绑定事件处理函数
    bindEventHandlers();
    
    // AI设置相关事件监听
    // 隐藏保存按钮，因为现在使用自动保存
    const saveButton = document.getElementById('SaveAISettings');
    if (saveButton) saveButton.classList.add('hidden');
    
    document.getElementById('ResetAISettings').addEventListener('click', resetAISettingsToDefault);
    
    // 显示插件版本信息
    displayExtensionInfo();
    
    // 高级设置已隐藏并禁用编辑
    
    // 添加系统提示词按钮
    document.getElementById('AddSystemPrompt').addEventListener('click', function() {
      // 使用新格式创建提示词（包含title和content字段）
      const newPrompt = { 
        id: generateUniqueId(), 
        title: '新提示词', 
        content: '' 
      };
      
      // 确保systemPrompts数组存在
      if (!Array.isArray(window.options.AI.systemPrompts)) {
        window.options.AI.systemPrompts = [];
      }
      
      // 将新提示词添加到数组中
      window.options.AI.systemPrompts.push(newPrompt);
      
      // 添加到UI
      addPromptItem(newPrompt);
      
      // 聚焦到新添加的提示词标题输入框
      const newTitleInput = document.querySelector(`[data-id="${newPrompt.id}"] .prompt-title`);
      if (newTitleInput) {
        newTitleInput.focus();
        newTitleInput.select(); // 选中文本以便直接输入
      }
      
      // 自动保存
      saveSettings(window.options);
    });
    
    // 初始化系统提示词列表
    initSystemPrompts();
  });
});

/**
 * 初始化标签页功能
 */
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // 标签页映射关系 - 提供用户友好的URL哈希值
  const tabMappings = {
    'base': 'basic',          // 基础信息
    'consumption': 'consumption', // 消费类型
    'payment': 'payment',     // 付款方式
    'vip': 'vip',             // 会员等级
    'commoninfo': 'commoninfo', // 常用信息
    'AI': 'ai',               // AI大模型
    // 别名映射
    'info': 'basic',          // 基础信息的别名
    'basic': 'basic',         // 直接使用标签页ID
    '消费': 'consumption',     // 中文别名
    '付款': 'payment',        // 中文别名
    '会员': 'vip',            // 中文别名
    '常用': 'commoninfo',     // 中文别名
    'ai': 'ai'                // 小写别名
  };
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 移除所有标签按钮的活跃状态
      tabButtons.forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700');
        btn.classList.add('bg-white', 'text-gray-700', 'hover:bg-gray-100');
      });
      
      // 隐藏所有标签内容
      tabContents.forEach(content => {
        content.classList.add('hidden');
      });
      
      // 激活当前标签按钮
      button.classList.remove('bg-white', 'text-gray-700', 'hover:bg-gray-100');
      button.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-700');
      
      // 显示当前标签内容
      const tabId = button.getAttribute('data-tab');
      document.getElementById(tabId).classList.remove('hidden');
      
      // 更新URL哈希值
      let hash = '';
      for (const [key, value] of Object.entries(tabMappings)) {
        if (value === tabId) {
          hash = key;
          break;
        }
      }
      if (hash) {
        window.location.hash = hash;
      } else {
        // 对于没有映射的标签页，使用data-tab作为哈希值
        window.location.hash = tabId;
      }
    });
  });
  
  // 检查URL哈希值并激活对应的标签页
  function checkUrlHash() {
    const hash = window.location.hash.substring(1).toLowerCase();
    if (hash) {
      let targetTabId = hash;
      
      // 检查是否有映射
      if (tabMappings[hash]) {
        targetTabId = tabMappings[hash];
      }
      
      // 查找并点击对应的标签按钮
      const targetButton = document.querySelector(`.tab-btn[data-tab="${targetTabId}"]`);
      if (targetButton) {
        targetButton.click();
      }
    }
  }
  
  // 初始检查
  checkUrlHash();
  
  // 监听哈希变化事件
  window.addEventListener('hashchange', checkUrlHash);
}

/**
 * 初始化折叠面板
 */
function initCollapsiblePanels() {
  // 关于插件折叠面板
  document.getElementById('about-toggle').addEventListener('click', () => {
    const content = document.getElementById('about-content');
    const icon = document.getElementById('about-icon');
    
    content.classList.toggle('hidden');
    icon.classList.toggle('transform');
    icon.classList.toggle('rotate-180');
  });
  
  // 重置插件折叠面板
  document.getElementById('reset-toggle').addEventListener('click', () => {
    const content = document.getElementById('reset-content');
    const icon = document.getElementById('reset-icon');
    
    content.classList.toggle('hidden');
    icon.classList.toggle('transform');
    icon.classList.toggle('rotate-180');
  });
}



/**
 * 从Chrome存储加载设置数据
 */
async function loadSettings() {
  try {
    // 使用从main.js导入的getSettings函数
    const settings = await getSettings() || getDefaultSettings();
    
    // 加载酒店信息
    if (settings.Hotel && settings.Hotel.length > 0) {
      document.getElementById('SetHotelName').value = settings.Hotel[0].HotelName || '';
      document.getElementById('SetHotelAddress').value = settings.Hotel[0].HotelAddress || '';
      document.getElementById('SetStaffAD').value = settings.Staff[0].StaffName || '';
      document.getElementById('SetHotelPhone').value = settings.Hotel[0].HotelPhone || '';
      document.getElementById('SetHotelNum').value = settings.Hotel[0].HotelNumber || '';
      document.getElementById('SetHotelZip').value = settings.Hotel[0].HotelZip || '';
      document.getElementById('SetHotelFax').value = settings.Hotel[0].HotelFax || '';
    }
    
    // 加载消费类型
    if (settings.Consumption && settings.Consumption.length > 0) {
      const consumptionTable = document.getElementById('ConsumptionTable').querySelector('tbody');
      consumptionTable.innerHTML = '';
      
      settings.Consumption.forEach(type => {
        addConsumptionTypeToTable(type);
      });
    }
    
    // 加载付款方式
    if (settings.Payment && settings.Payment.length > 0) {
      const paymentTable = document.getElementById('PaymentTable').querySelector('tbody');
      paymentTable.innerHTML = '';
      
      settings.Payment.forEach(type => {
        addPaymentTypeToTable(type);
      });
    }
    
    // 加载会员等级
    if (settings.Vip && settings.Vip.length > 0) {
      const vipTable = document.getElementById('VipTable').querySelector('tbody');
      vipTable.innerHTML = '';
      
      settings.Vip.forEach(vip => {
        addVipLevelToTable(vip);
      });
    }
    
    // 保存设置到全局变量以便后续操作
    window.options = settings;
    
    // 检查是否需要密码解锁
    checkPasswordLock();
  } catch (error) {
    console.error('加载设置失败:', error);
    showModal('错误', '加载设置失败，请刷新页面重试。');
  }
}

/**
 * 绑定事件处理函数
 */
function bindEventHandlers() {
  // 添加消费类型
  document.getElementById('AddConsumptionType').addEventListener('click', addConsumptionType);
  
  // 添加付款方式
  document.getElementById('AddPaymentType').addEventListener('click', addPaymentType);
  
  // 添加会员等级
  document.getElementById('AddVip').addEventListener('click', addVipLevel);
  
  // 添加常用信息
  document.getElementById('AddCommonInfo').addEventListener('click', addCommonInfo);
  
  // 重置默认设置
  document.getElementById('ResetDefault').addEventListener('click', resetDefaultSettings);
  
  // 为删除按钮添加事件委托
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('del-link')) {
      const button = event.target;
      const row = button.closest('tr');
      const tableBody = row.closest('tbody');
      const tableId = tableBody.closest('table').id;
      
      // 删除行
      deleteTableRow(button);
      
      // 更新对应的数据
      updateDataAfterDelete(tableId, row);
      
      // 自动保存
        saveSettings(window.options);
    }
  });
  
  // 添加即改即存事件监听
  setupAutoSaveListeners();
}

/**
 * 设置即改即存事件监听器
 */
function setupAutoSaveListeners() {
  // 为基础信息表单添加事件监听
  const hotelInfoInputs = document.querySelectorAll('#basic input');
  hotelInfoInputs.forEach(input => {
    input.addEventListener('input', () => {
      // 更新options对象
      updateHotelInfo();
      // 延迟保存以避免频繁保存
      debounce(() => saveSettings(window.options), 500)();
    });
  });
  
  // 为AI设置区域添加自动保存
  const aiSettingsInputs = document.querySelectorAll('#AISettings input, #AISettings select');
  aiSettingsInputs.forEach(input => {
    input.addEventListener('input', () => {
      // 更新AI设置对象
      updateAISettings();
      // 延迟保存以避免频繁保存
      debounce(() => saveSettings(window.options), 500)();
    });
  });
}

/**
 * 防抖函数，用于延迟保存操作
 */
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * 更新酒店信息
 */
function updateHotelInfo() {
  if (!window.options) {
    window.options = getDefaultSettings();
  }
  
  window.options.Hotel[0].HotelName = document.getElementById('SetHotelName').value;
  window.options.Hotel[0].HotelAddress = document.getElementById('SetHotelAddress').value;
  window.options.Staff[0].StaffName = document.getElementById('SetStaffAD').value;
  window.options.Hotel[0].HotelPhone = document.getElementById('SetHotelPhone').value;
  window.options.Hotel[0].HotelNumber = document.getElementById('SetHotelNum').value;
  window.options.Hotel[0].HotelZip = document.getElementById('SetHotelZip').value;
  window.options.Hotel[0].HotelFax = document.getElementById('SetHotelFax').value;
}

/**
 * 更新AI设置
 */
function updateAISettings() {
  if (!window.options) {
    window.options = getDefaultSettings();
  }
  
  // 更新AI API设置
  window.options.AI.APIKey = document.getElementById('APIKey').value;
  window.options.AI.APIBaseURL = document.getElementById('APIBaseURL').value;
  window.options.AI.AIModelType = document.getElementById('AIModelType').value;
  
  // 更新AI参数设置
  window.options.AI.MaxTokens = parseInt(document.getElementById('MaxTokens').value) || 16000;
  window.options.AI.Temperature = parseFloat(document.getElementById('Temperature').value) || 0.7;
  window.options.AI.TopP = parseFloat(document.getElementById('TopP').value) || 1;
  
  // 更新其他AI设置
  if (document.getElementById('EnableCache')) {
    window.options.AI.EnableCache = document.getElementById('EnableCache').checked;
  }
  
  // 如果存在频率惩罚和存在惩罚设置，也进行更新
  if (document.getElementById('FrequencyPenalty')) {
    window.options.AI.FrequencyPenalty = parseFloat(document.getElementById('FrequencyPenalty').value) || 0;
  }
  if (document.getElementById('PresencePenalty')) {
    window.options.AI.PresencePenalty = parseFloat(document.getElementById('PresencePenalty').value) || 0;
  }
  if (document.getElementById('CacheExpirationMinutes')) {
    window.options.AI.CacheExpirationMinutes = parseInt(document.getElementById('CacheExpirationMinutes').value) || 30;
  }
  
  // 更新系统提示词（这里只更新第一个提示词作为默认提示词）
  if (window.options.AI.systemPrompts && window.options.AI.systemPrompts.length > 0) {
    // 确保默认提示词反映最新的SystemPrompt值
    window.options.AI.SystemPrompt = window.options.AI.systemPrompts[0].content;
  }
}

/**
/**
 * 删除表格行后更新数据
 */
function updateDataAfterDelete(tableId, row) {
  if (!window.options) {
    return;
  }
  
  switch (tableId) {
    case 'ConsumptionTable':
      const consumptionType = row.querySelector('td:first-child').textContent;
      window.options.Consumption = window.options.Consumption.filter(type => type !== consumptionType);
      break;
      
    case 'PaymentTable':
      const paymentType = row.querySelector('td:first-child').textContent;
      window.options.Payment = window.options.Payment.filter(type => type !== paymentType);
      break;
      
    case 'VipTable':
      const vipType = row.querySelector('td:first-child').textContent;
      window.options.Vip = window.options.Vip.filter(vip => vip.VipType !== vipType);
      break;
      
      case 'CommonInfoTable':
      const infoId = row.getAttribute('data-id');
      window.options.CommonInfo = window.options.CommonInfo.filter(info => info.id !== infoId);
      break;
  }
}



/**
 * 添加消费类型
 */
function addConsumptionType() {
  const typeInput = document.getElementById('SetConsumptionType');
  const type = typeInput.value.trim();
  
  if (!type) {
    showModal('提示', '请填写消费类型！');
    return;
  }
  
  if (!window.options) {
    window.options = getDefaultSettings();
  }
  
  if (window.options.Consumption.indexOf(type) === -1) {
    addConsumptionTypeToTable(type);
    window.options.Consumption.push(type);
    typeInput.value = '';
    
    // 自动保存
    saveSettings(window.options);
  } else {
    showModal('提示', '已存在该消费类型！');
  }
}

/**
 * 将消费类型添加到表格
 */
function addConsumptionTypeToTable(type) {
  const consumptionTable = document.getElementById('ConsumptionTable').querySelector('tbody');
  const row = document.createElement('tr');
  row.className = 'hover:bg-gray-50';
  row.innerHTML = `
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${type}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      <button type="button" class="text-red-500 hover:text-red-700 del-link">删除</button>
    </td>
  `;
  consumptionTable.appendChild(row);
}



/**
 * 添加付款方式
 */
function addPaymentType() {
  const typeInput = document.getElementById('SetPaymentType');
  const type = typeInput.value.trim();
  
  if (!type) {
    showModal('提示', '请填写付款方式！');
    return;
  }
  
  if (!window.options) {
    window.options = getDefaultSettings();
  }
  
  if (window.options.Payment.indexOf(type) === -1) {
    addPaymentTypeToTable(type);
    window.options.Payment.push(type);
    typeInput.value = '';
    
    // 自动保存
    saveSettings(window.options);
  } else {
    showModal('提示', '已存在该付款方式！');
  }
}

/**
 * 将付款方式添加到表格
 */
function addPaymentTypeToTable(type) {
  const paymentTable = document.getElementById('PaymentTable').querySelector('tbody');
  const row = document.createElement('tr');
  row.className = 'hover:bg-gray-50';
  row.innerHTML = `
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${type}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      <button type="button" class="text-red-500 hover:text-red-700 del-link">删除</button>
    </td>
  `;
  paymentTable.appendChild(row);
}



/**
 * 添加会员等级
 */
function addVipLevel() {
  const levelInput = document.getElementById('AddVipLevel');
  const discountInput = document.getElementById('AddVipDiscount');
  
  const level = levelInput.value.trim();
  const discount = discountInput.value.trim();
  
  if (!level || !discount) {
    showModal('提示', '请填写完整会员计划！');
    return;
  }
  
  if (!window.options) {
    window.options = getDefaultSettings();
  }
  
  // 检查是否已存在相同等级
  const exists = window.options.Vip.some(vip => vip.VipType === level);
  
  if (!exists) {
    const vip = { VipType: level, VipDiscount: discount };
    addVipLevelToTable(vip);
    window.options.Vip.push(vip);
    
    // 清空输入框
    levelInput.value = '';
    discountInput.value = '';
    
    // 自动保存
    saveSettings(window.options);
  } else {
    showModal('提示', '已存在该会员等级！');
  }
}

/**
 * 将会员等级添加到表格
 */
function addVipLevelToTable(vip) {
  const vipTable = document.getElementById('VipTable').querySelector('tbody');
  const row = document.createElement('tr');
  row.className = 'hover:bg-gray-50';
  row.innerHTML = `
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${vip.VipType}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${vip.VipDiscount}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      <button type="button" class="text-red-500 hover:text-red-700 del-link">删除</button>
    </td>
  `;
  vipTable.appendChild(row);
}





/**
 * 重置为默认设置
 */
function resetDefaultSettings() {
  // 使用模态框代替confirm弹窗
  showConfirmModal('警告', '此操作将清除所有保存的设置，并恢复默认设置！确定要继续吗？', {
    confirmText: '确定',
    cancelText: '取消',
    onConfirm: () => {
      // 确定按钮的回调
      chrome.storage.local.clear().then(() => {
        // 重置全局变量
        window.options = getDefaultSettings();
        
        // 刷新页面重新加载默认设置
        location.reload();
      }).catch(error => {
        console.error('重置设置失败:', error);
        showModal('错误', '重置设置失败，请刷新页面重试。');
      });
    }
  });
}

/**
 * 删除表格行
 */
function deleteTableRow(button) {
  const row = button.closest('tr');
  if (row) {
    // 添加动画效果
    row.style.transition = 'opacity 0.3s ease';
    row.style.opacity = '0';
    
    setTimeout(() => {
      row.remove();
    }, 300);
  }
}



/**
 * 显示插件信息
 */
function displayExtensionInfo() {
  try {
    const manifest = chrome.runtime.getManifest();
    
    // 先检查about-content是否存在且是隐藏状态，如果是则临时显示它
    const aboutContent = document.getElementById('about-content');
    const wasHidden = aboutContent && aboutContent.classList.contains('hidden');
    
    // 如果内容区域是隐藏的，先临时显示它以便能够操作内部元素
    if (wasHidden) {
      aboutContent.classList.remove('hidden');
    }
    
    // 现在可以安全地获取并设置AboutExtensions元素内容
    const aboutElement = document.getElementById('AboutExtensions');
    if (aboutElement) {
      aboutElement.innerHTML = `
        <p><strong>名称：</strong>${manifest.name || '酒店PMS工具箱'}</p>
        <p><strong>版本：</strong>${manifest.version || 'null'}</p>
        <p><strong>作者：</strong>${manifest.author || 'Siem'}</p>
        <p><strong>网址：</strong><a href="https://pmstool.beida.xyz" target="_blank" class="text-blue-600 hover:text-blue-800">https://pmstool.beida.xyz</a></p>
        <div class="mt-4 text-center">
          <p class="mb-2 text-gray-700">感谢您使用本工具！希望得到您的支持和鼓励。</p>
          <img src="/src/static/PaymentCode.jpg" alt="支付码" class="w-48 rounded-md hover:shadow-lg m-auto">
        </div>
      `;
    }
    
    // 如果内容区域原本是隐藏的，恢复隐藏状态
    if (wasHidden) {
      aboutContent.classList.add('hidden');
    }
    
    // 更新版本号显示（如果元素存在）
    const versionElement = document.getElementById('current-version');
    if (versionElement) {
      versionElement.textContent = `版本: ${manifest.version || '0.1.0'}`;
    }
  } catch (error) {
    console.error('显示插件信息失败:', error);
  }
}

/**
 * 添加常用信息
 */
function addCommonInfo() {
  // 生成唯一ID
  const id = 'info_' + Date.now();
  const name = '新建信息';
  const content = '';
  
  if (!window.options) {
    window.options = getDefaultSettings();
  }
  
  const info = { id, name, content };
  
  // 添加到数据
  window.options.CommonInfo.push(info);
  
  // 添加到列表
  addCommonInfoToList(info);
  
  // 显示编辑区域
  document.getElementById('CommonInfoEditor').classList.remove('hidden');
  
  // 加载到编辑区域
  loadCommonInfoForEdit(info.id);
  
  // 自动保存
  saveSettings(window.options);
  
  // 聚焦到内容输入框
  document.getElementById('EditCommonInfoContent').focus();
}

/**
 * 将常用信息添加到列表
 */
function addCommonInfoToList(info) {
  const commonInfoList = document.getElementById('CommonInfoList');
  const li = document.createElement('li');
  li.className = 'px-4 py-3 hover:bg-gray-100 cursor-pointer';
  li.setAttribute('data-id', info.id);
  li.innerHTML = `
    <div class="flex items-center justify-between">
      <span class="text-sm text-gray-900">${info.name}</span>
      <div class="flex space-x-2">
        <button type="button" class="text-blue-500 hover:text-blue-700 text-xs edit-commoninfo" data-id="${info.id}">编辑</button>
        <button type="button" class="text-red-500 hover:text-red-700 text-xs del-link" data-id="${info.id}">删除</button>
      </div>
    </div>
  `;
  
  commonInfoList.appendChild(li);
  
  // 添加点击事件以在右侧显示内容
  li.addEventListener('click', function(e) {
    // 如果点击的是按钮，则不触发整个行的点击事件
    if (e.target.classList.contains('edit-commoninfo') || e.target.classList.contains('del-link')) {
      return;
    }
    
    loadCommonInfoForEdit(info.id);
  });
  
  // 为编辑按钮添加点击事件
  const editButton = li.querySelector('.edit-commoninfo');
  editButton.addEventListener('click', function(e) {
    e.stopPropagation(); // 阻止事件冒泡
    const infoId = this.getAttribute('data-id');
    loadCommonInfoForEdit(infoId);
  });
  
  // 为删除按钮添加点击事件
  const deleteButton = li.querySelector('.del-link');
  deleteButton.addEventListener('click', function(e) {
    e.stopPropagation(); // 阻止事件冒泡
    const infoId = this.getAttribute('data-id');
    const listItem = this.closest('li');
    
    // 显示确认模态框
    showModal('确认删除', '确定要删除这条常用信息吗？', {
      onConfirm: function() {
        // 删除列表项
        listItem.remove();
        
        // 更新数据
        window.options.CommonInfo = window.options.CommonInfo.filter(item => item.id !== infoId);
        
        // 自动保存
        saveSettings(window.options);
        
        // 隐藏编辑区域
        document.getElementById('CommonInfoEditor').classList.add('hidden');
        
        // 清空编辑区域内容
        document.getElementById('EditCommonInfoName').value = '';
        document.getElementById('EditCommonInfoContent').value = '';
      }
    });
  });
}

/**
 * 加载常用信息用于编辑
 */
function loadCommonInfoForEdit(infoId) {
  const info = window.options.CommonInfo.find(item => item.id === infoId);
  
  if (info) {
    // 显示编辑区域
    document.getElementById('CommonInfoEditor').classList.remove('hidden');
    
    const nameInput = document.getElementById('EditCommonInfoName');
    const contentInput = document.getElementById('EditCommonInfoContent');
    
    // 移除之前的事件监听器
    const newNameInput = nameInput.cloneNode(true);
    const newContentInput = contentInput.cloneNode(true);
    nameInput.parentNode.replaceChild(newNameInput, nameInput);
    contentInput.parentNode.replaceChild(newContentInput, contentInput);
    
    // 设置值
    newNameInput.value = info.name;
    newContentInput.value = info.content;
    
    // 添加自动保存的事件监听器
    const debouncedAutoSave = debounce(() => {
      autoSaveCommonInfo(infoId, newNameInput.value, newContentInput.value);
    }, 1000); // 延迟1秒保存，避免频繁保存
    
    newNameInput.addEventListener('input', debouncedAutoSave);
    newContentInput.addEventListener('input', debouncedAutoSave);
    
    // 先移除所有列表项的高亮样式
    document.querySelectorAll('#CommonInfoList li').forEach(item => {
      item.classList.remove('bg-blue-50', 'border-l-4');
    });
    
    // 为当前选中的项添加高亮样式
    const currentItem = document.querySelector(`#CommonInfoList li[data-id="${infoId}"]`);
    if (currentItem) {
      currentItem.classList.add('bg-blue-50', 'border-l-4');
    }
  }
}

/**
 * 自动保存常用信息
 */
function autoSaveCommonInfo(infoId, name, content) {
  const trimmedName = name.trim();
  const trimmedContent = content.trim();
  
  // 找到要更新的信息
  const index = window.options.CommonInfo.findIndex(item => item.id === infoId);
  
  if (index !== -1) {
    // 检查名称是否已存在（排除当前项）
    const nameExists = window.options.CommonInfo.some((item, i) => 
      i !== index && item.name.trim() === trimmedName && trimmedName !== ''
    );
    
    if (nameExists) {
      showModal('提示', '已存在同名的常用信息！请修改信息名称。');
      return;
    }
    
    // 保存原始值，以便更新
    const originalName = window.options.CommonInfo[index].name;
    const originalContent = window.options.CommonInfo[index].content;
    
    // 更新信息
    window.options.CommonInfo[index].name = trimmedName || '新建信息';
    window.options.CommonInfo[index].content = trimmedContent;
    
    // 更新列表显示（如果名称已更改）
    if (trimmedName !== originalName) {
      updateCommonInfoInList(infoId, window.options.CommonInfo[index].name, trimmedContent);
    }
    
    // 自动保存
    saveSettings(window.options);
  }
}

/**
 * 更新列表中的常用信息
 */
function updateCommonInfoInList(infoId, name, content) {
  const listItem = document.querySelector(`#CommonInfoList li[data-id="${infoId}"]`);
  if (listItem) {
    listItem.querySelector('span').textContent = name;
  }
}

/**
 * 初始化常用信息相关功能
 */
function initCommonInfo() {
  // 加载常用信息到列表
  if (window.options && window.options.CommonInfo && window.options.CommonInfo.length > 0) {
    document.getElementById('CommonInfoList').innerHTML = '';
    window.options.CommonInfo.forEach(info => {
      addCommonInfoToList(info);
    });
  }
  
  // 绑定添加按钮事件
  document.getElementById('AddCommonInfo').addEventListener('click', addCommonInfo);
  
  // 绑定上传按钮事件
  document.getElementById('UploadCommonInfo').addEventListener('click', handleUploadCommonInfo);
  
  // 隐藏保存和取消按钮，因为现在使用自动保存
  const saveButton = document.getElementById('SaveCommonInfo');
  const cancelButton = document.getElementById('CancelEdit');
  if (saveButton) saveButton.classList.add('hidden');
  if (cancelButton) cancelButton.classList.add('hidden');
  
  // 确保没有默认选中的项
  setTimeout(() => {
    document.querySelectorAll('#CommonInfoList li').forEach(item => {
      item.classList.remove('bg-blue-50', 'border-l-4');
    });
  }, 100);
  
  // 额外的保障措施，确保所有列表项初始样式一致
  setTimeout(() => {
    document.querySelectorAll('#CommonInfoList li').forEach(item => {
      item.classList.remove('bg-blue-50', 'border-l-4');
    });
  }, 300);
}

/**
 * 处理上传常用信息
 */
function handleUploadCommonInfo() {
  // 创建隐藏的文件输入元素
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,.txt,.md,.markdown';
  fileInput.multiple = true; // 允许选择多个文件
  
  fileInput.addEventListener('change', function(e) {
    const files = e.target.files;
    if (files.length > 0) {
      const commonInfoData = [];
      let processedCount = 0;
      
      // 处理每个选中的文件
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
          try {
            const content = event.target.result;
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            if (fileExtension === 'json') {
              // 处理JSON文件
              try {
                const jsonData = JSON.parse(content);
                if (Array.isArray(jsonData)) {
                  // 如果是数组，添加所有项
                  commonInfoData.push(...jsonData);
                } else if (typeof jsonData === 'object') {
                  // 如果是单个对象，添加为一项
                  commonInfoData.push(jsonData);
                } else {
                  throw new Error('JSON格式不正确');
                }
              } catch (jsonError) {
                console.error('JSON解析失败:', jsonError);
                showModal('错误', `文件${file.name}不是有效的JSON格式！`);
              }
            } else {
              // 处理TXT或Markdown文件
              // 提取文件名（不包含扩展名）作为标题
              const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
              
              // 创建新的常用信息项
              const infoItem = {
                id: 'info_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                name: fileNameWithoutExt,
                content: content
              };
              
              commonInfoData.push(infoItem);
            }
          } catch (error) {
            console.error('处理文件失败:', error);
            showModal('错误', `处理文件${file.name}失败！`);
          } finally {
            processedCount++;
            
            // 当所有文件都处理完成后
            if (processedCount === files.length) {
              processAndSaveCommonInfo(commonInfoData);
            }
          }
        };
        
        reader.readAsText(file);
      });
    }
  });
  
  // 触发文件选择对话框
  fileInput.click();
}

/**
 * 处理并保存常用信息数据
 */
function processAndSaveCommonInfo(commonInfoData) {
  if (commonInfoData.length === 0) {
    showModal('提示', '没有成功处理任何文件！');
    return;
  }
  
  // 检查是否有重复名称
  const existingNames = window.options.CommonInfo.map(info => info.name);
  const duplicateNames = commonInfoData
    .map(info => info.name)
    .filter(name => existingNames.includes(name));
  
  if (duplicateNames.length > 0) {
    if (confirm(`检测到${duplicateNames.length}个重复名称的常用信息，是否覆盖？`)) {
      // 移除重复项
      window.options.CommonInfo = window.options.CommonInfo.filter(
        info => !duplicateNames.includes(info.name)
      );
    } else {
      // 过滤掉重复项
      commonInfoData = commonInfoData.filter(
        info => !duplicateNames.includes(info.name)
      );
      
      if (commonInfoData.length === 0) {
        showModal('提示', '所有文件内容都已存在于常用信息中！');
        return;
      }
    }
  }
  
  // 为每个信息生成新ID（如果没有）
  commonInfoData = commonInfoData.map(info => ({...info,id: info.id || 'info_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)}));
  
  // 保存第一个上传的信息项ID，用于后续打开
  const firstUploadedInfoId = commonInfoData[0].id;
  
  // 添加到现有数据
  window.options.CommonInfo = [...window.options.CommonInfo, ...commonInfoData];
  
  // 更新列表显示
  document.getElementById('CommonInfoList').innerHTML = '';
  window.options.CommonInfo.forEach(info => {
    addCommonInfoToList(info);
  });
  
  // 自动保存
  saveSettings(window.options);
  
  // 打开第一个上传的信息项
  if (firstUploadedInfoId) {
    loadCommonInfoForEdit(firstUploadedInfoId);
  }
}

/**
 * 初始化AI设置
 */
function initAISettings() {
  if (!window.options || !window.options.AI) {
    return;
  }
  
  const aiSettings = window.options.AI;
  
  // 设置模型类型
  const modelTypeSelect = document.getElementById('AIModelType');
  if (modelTypeSelect) {
    modelTypeSelect.value = aiSettings.AIModelType || 'doubao-1-5-pro-32k-250115';
  }
  
  // 设置API Key
  const apiKeyInput = document.getElementById('APIKey');
  if (apiKeyInput) {
    apiKeyInput.value = aiSettings.APIKey || '';
  }
  
  // 设置API基础URL
  const apiBaseURLInput = document.getElementById('APIBaseURL');
  if (apiBaseURLInput) {
    apiBaseURLInput.value = aiSettings.APIBaseURL || 'https://ark.cn-beijing.volces.com/api/v3';
  }
  
  // 设置高级参数
  const maxTokensInput = document.getElementById('MaxTokens');
  if (maxTokensInput) {
    maxTokensInput.value = aiSettings.MaxTokens || 16000;
  }
  
  const temperatureInput = document.getElementById('Temperature');
  if (temperatureInput) {
    temperatureInput.value = aiSettings.Temperature || 0.7;
  }
  
  const topPInput = document.getElementById('TopP');
  if (topPInput) {
    topPInput.value = aiSettings.TopP || 1;
  }
  
  const frequencyPenaltyInput = document.getElementById('FrequencyPenalty');
  if (frequencyPenaltyInput) {
    frequencyPenaltyInput.value = aiSettings.FrequencyPenalty || 0;
  }
  
  const presencePenaltyInput = document.getElementById('PresencePenalty');
  if (presencePenaltyInput) {
    presencePenaltyInput.value = aiSettings.PresencePenalty || 0;
  }
  
  const cacheExpirationInput = document.getElementById('CacheExpirationMinutes');
  if (cacheExpirationInput) {
    cacheExpirationInput.value = aiSettings.CacheExpirationMinutes || 30;
  }
  
  // 设置缓存开关
  const enableCacheCheckbox = document.getElementById('EnableCache');
  if (enableCacheCheckbox) {
    enableCacheCheckbox.checked = aiSettings.EnableCache !== false; // 默认启用
  }
  
  // 初始化系统提示词列表
  initSystemPrompts();

  // 添加API Key链接的点击事件处理逻辑
  const apiKeyLink = document.getElementById('GetAPIKeyLink');
  if (apiKeyLink) {
    apiKeyLink.addEventListener('click', function() {
      // 使用showModal函数显示包含微信图片和提示信息的模态框
      showModal('API Key 获取说明', 
        '<div style="text-align: center;"><p>AI助手默认<b>支持 OpenAI 兼容接口</b>，理论上市面上大部分 AI模型都可以使用。这里 API Key <b>不免费提供</b>，大模型 API 获取及使用方法可自行百度。<br><br>如果你为了节省时间，欢迎您联系我<b>知识付费</b>并购买 API key。<br><img src="/src/static/WechatCode.jpg" alt="微信联系方式" style="max-width: 200px; height: auto; margin: 15px auto;"><h3><b>微信号：SiemYan</b></h3><br><br>免费工具开发不易，感谢理解与支持！</div>'
      );
    });
  }
}

/**
 * 保存AI设置
 */
function saveAISettings() {
  if (!window.options) {
    window.options = getDefaultSettings();
  }
  
  if (!window.options.AI) {
    window.options.AI = getDefaultSettings().AI;
  }
  
  const aiSettings = window.options.AI;
  
  // 获取模型类型
  const modelTypeSelect = document.getElementById('AIModelType');
  if (modelTypeSelect) {
    aiSettings.AIModelType = modelTypeSelect.value;
  }
  
  // 获取API Key
  const apiKeyInput = document.getElementById('APIKey');
  if (apiKeyInput) {
    aiSettings.APIKey = apiKeyInput.value;
  }
  
  // 获取API基础URL
  const apiBaseURLInput = document.getElementById('APIBaseURL');
  if (apiBaseURLInput) {
    aiSettings.APIBaseURL = apiBaseURLInput.value;
  }
  
  // 获取高级参数
  const maxTokensInput = document.getElementById('MaxTokens');
  if (maxTokensInput) {
    aiSettings.MaxTokens = parseInt(maxTokensInput.value) || 16000;
  }
  
  const temperatureInput = document.getElementById('Temperature');
  if (temperatureInput) {
    aiSettings.Temperature = parseFloat(temperatureInput.value) || 0.7;
  }
  
  const topPInput = document.getElementById('TopP');
  if (topPInput) {
    aiSettings.TopP = parseFloat(topPInput.value) || 1;
  }
  
  const frequencyPenaltyInput = document.getElementById('FrequencyPenalty');
  if (frequencyPenaltyInput) {
    aiSettings.FrequencyPenalty = parseFloat(frequencyPenaltyInput.value) || 0;
  }
  
  const presencePenaltyInput = document.getElementById('PresencePenalty');
  if (presencePenaltyInput) {
    aiSettings.PresencePenalty = parseFloat(presencePenaltyInput.value) || 0;
  }
  
  const cacheExpirationInput = document.getElementById('CacheExpirationMinutes');
  if (cacheExpirationInput) {
    aiSettings.CacheExpirationMinutes = parseInt(cacheExpirationInput.value) || 30;
  }
  
  // 获取缓存开关
  const enableCacheCheckbox = document.getElementById('EnableCache');
  if (enableCacheCheckbox) {
    aiSettings.EnableCache = enableCacheCheckbox.checked;
  }
  
  // 保存设置
  saveSettings(window.options).then(success => {
    if (success) {
      showModal('成功', 'AI设置已保存！');
    } else {
      showModal('错误', '保存AI设置失败，请重试。');
    }
  });
}

/**
 * 重置AI设置到默认值
 */
function resetAISettingsToDefault() {
  showModal('警告', '此操作将重置所有AI设置为默认值！确定要继续吗？');
  
  // 获取模态框元素
  const modal = document.getElementById('DefaultModal');
  const confirmBtn = document.getElementById('DefaultModalConfirmBtn');
  
  // 保存原始事件处理函数
  const originalHandler = confirmBtn.onclick;
  
  // 添加新的确认处理函数
  confirmBtn.onclick = function() {
    // 恢复原始事件处理函数
    confirmBtn.onclick = originalHandler;
    
    // 隐藏模态框
    modal.classList.add('hidden');
    
    // 获取默认AI设置
    const defaultAISettings = getDefaultSettings().AI;
    
    // 重置本地设置
    if (window.options) {
      window.options.AI = defaultAISettings;
    }
    
    // 重新初始化表单
    initAISettings();
    
    // 清空系统提示词列表
    const promptsList = document.getElementById('SystemPromptsList');
    if (promptsList) {
      promptsList.innerHTML = '';
    }
    
    // 使用默认设置中的所有预设提示词
    if (Array.isArray(window.options.AI.systemPrompts)) {
      window.options.AI.systemPrompts.forEach(prompt => {
        addPromptItem(prompt);
      });
    } else {
      // 如果没有预设提示词，则添加一个默认提示词
      const defaultPrompt = {
        id: generateUniqueId(),
        title: '默认提示词',
        content: defaultAISettings.SystemPrompt
      };
      window.options.AI.systemPrompts = [defaultPrompt];
      addPromptItem(defaultPrompt);
    }
    
    // 保存设置
    saveSettings(window.options).then(success => {
      if (success) {
        showModal('成功', 'AI设置已重置为默认值！');
      } else {
        showModal('错误', '重置AI设置失败，请重试。');
      }
    });
  };
}

/**
 * 生成唯一ID
 */
function generateUniqueId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 添加提示词项
 */
function addPromptItem(prompt) {
  const promptsList = document.getElementById('SystemPromptsList');
  if (!promptsList) return;
  
  const promptItem = document.createElement('div');
  promptItem.className = 'bg-gray-50 p-4 rounded-md mb-2';
  promptItem.setAttribute('data-id', prompt.id);
  
  // 获取提示词的索引
  const promptIndex = window.options.AI.systemPrompts.findIndex(item => item.id === prompt.id);
  const displayIndex = promptIndex >= 0 ? promptIndex + 1 : 1;
  
  promptItem.innerHTML = `
    <div class="flex justify-between items-start mb-2">
      <span class="text-sm font-medium text-gray-700">提示词 #${displayIndex}</span>
      <button type="button" class="text-red-500 hover:text-red-700 delete-prompt" data-id="${prompt.id}">
        <i class="ri-delete-bin-line text-sm"></i>
      </button>
    </div>
    <div class="space-y-2">
      <div>
        <label class="block text-xs text-gray-500 mb-1">提示词标题</label>
        <input type="text" class="prompt-title w-full p-2 border border-gray-300 rounded-md text-sm" placeholder="输入提示词标题..." value="${prompt.title || ''}">
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">提示词内容</label>
        <input type="text" class="prompt-content w-full p-2 border border-gray-300 rounded-md text-sm" placeholder="输入提示词内容..." value="${prompt.content || ''}">
      </div>
    </div>
  `;
  
  promptsList.appendChild(promptItem);
  
  // 为删除按钮添加事件监听
  const deleteButton = promptItem.querySelector('.delete-prompt');
  deleteButton.addEventListener('click', function() {
    const promptId = this.getAttribute('data-id');
    deletePrompt(promptId);
  });
  
  // 为标题和内容输入框添加自动保存事件
  const titleInput = promptItem.querySelector('.prompt-title');
  const contentInput = promptItem.querySelector('.prompt-content');
  
  setupAutoSaveForPromptInput(titleInput, 'title', prompt.id);
  setupAutoSaveForPromptInput(contentInput, 'content', prompt.id);
}

/**
 * 调整文本框高度以适应内容
 */
function adjustTextareaHeight(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = (textarea.scrollHeight < 200 ? textarea.scrollHeight : 200) + 'px';
}

/**
 * 删除提示词
 */
function deletePrompt(promptId) {
  if (!window.options || !window.options.AI || !window.options.AI.systemPrompts) {
    return;
  }
  
  // 过滤掉要删除的提示词
  window.options.AI.systemPrompts = window.options.AI.systemPrompts.filter(
    prompt => prompt.id !== promptId
  );
  
  // 从DOM中移除提示词元素
  const promptElement = document.querySelector(`[data-id="${promptId}"]`);
  if (promptElement) {
    promptElement.remove();
  }
  
  // 更新提示词序号
  updatePromptNumbers();
  
  // 自动保存
  saveSettings(window.options);
}

/**
 * 更新提示词序号
 */
function updatePromptNumbers() {
  const promptsList = document.getElementById('SystemPromptsList');
  if (!promptsList) return;
  
  const promptItems = promptsList.querySelectorAll('[data-id]');
  promptItems.forEach((item, index) => {
    const numberElement = item.querySelector('span.text-sm.font-medium');
    if (numberElement) {
      numberElement.textContent = `提示词 #${index + 1}`;
    }
  });
}

/**
 * 为输入框添加即改即存事件监听
 */
function setupAutoSaveForPromptInput(inputElement, fieldName, promptId) {
  if (!inputElement) return;
  
  inputElement.addEventListener('input', function() {
    // 更新系统提示词
    updateSystemPromptField(promptId, fieldName, this.value);
  });
}

/**
 * 为系统提示词区域设置自动保存（不再需要，因为已在addPromptItem中处理）
 */
function setupSystemPromptAutoSave() {
  // 现在在addPromptItem函数中为每个输入框单独设置自动保存
  // 此函数保留以保持向后兼容性
}

/**
 * 更新系统提示词的特定字段
 */
function updateSystemPromptField(promptId, fieldName, newContent) {
  if (!window.options || !window.options.AI || !Array.isArray(window.options.AI.systemPrompts)) {
    return;
  }
  
  const prompt = window.options.AI.systemPrompts.find(item => item.id === promptId);
  
  if (prompt) {
    // 更新数据
    prompt[fieldName] = newContent;
    
    // 自动保存
    debounce(() => {
      saveSettings(window.options);
    }, 500)();
  }
}

/**
 * 更新系统提示词（兼容旧版本）
 */
function updateSystemPrompt(promptId, newContent) {
  // 为保持向后兼容性，将text映射到content
  updateSystemPromptField(promptId, 'content', newContent);
}

/**
 * 初始化系统提示词列表
 */
function initSystemPrompts() {
  if (!window.options || !window.options.AI) {
    return;
  }
  
  // 确保systemPrompts数组存在
  if (!Array.isArray(window.options.AI.systemPrompts)) {
    window.options.AI.systemPrompts = [];
  }
  
  // 处理现有数据，确保每个提示词都有id、title和content字段
  window.options.AI.systemPrompts = window.options.AI.systemPrompts.map((prompt, index) => {
    // 为没有id的提示词生成唯一ID
    if (!prompt.id) {
      prompt.id = generateUniqueId();
    }
    
    // 处理旧格式数据（只有text字段）
    if (prompt.text && !prompt.content) {
      prompt.content = prompt.text;
      // 为没有标题的提示词添加默认标题
      if (!prompt.title) {
        prompt.title = `提示词 #${index + 1}`;
      }
      // 可以选择删除旧的text字段以保持数据一致性
      // delete prompt.text;
    }
    
    // 确保每个提示词都有标题
    if (!prompt.title) {
      prompt.title = `提示词 #${index + 1}`;
    }
    
    // 确保每个提示词都有内容
    if (!prompt.content) {
      prompt.content = '';
    }
    
    return prompt;
  });
  
  // 如果没有系统提示词，添加默认的
  if (window.options.AI.systemPrompts.length === 0) {
    const defaultPrompt = {
      id: generateUniqueId(),
      title: '默认提示词',
      content: window.options.AI.SystemPrompt || '你是一个AI助手'
    };
    window.options.AI.systemPrompts = [defaultPrompt];
  }
  
  // 渲染系统提示词列表
  const promptsList = document.getElementById('SystemPromptsList');
  if (promptsList) {
    promptsList.innerHTML = '';
    window.options.AI.systemPrompts.forEach(prompt => {
      addPromptItem(prompt);
    });
  }
}