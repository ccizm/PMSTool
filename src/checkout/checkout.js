/**
 * PMS工具结账页面脚本
 * 处理结账页面的交互逻辑和数据处理
 */

// 导入公共函数
import { showModal, nowDate, formatDate, addDay, addDayObj, initDatePicker, options, Checkout } from '../main.js'
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', function () {
  // 初始化日期
  document.getElementById('PrintDate').value = nowDate();
  document.getElementById('ConsumptionDate').value = nowDate();
  document.getElementById('PaymentDate').value = nowDate();

  // 初始化日期选择器
  try {
    // 打印时间日期选择器
    initDatePicker('PrintDate', {
      format: 'yyyy-MM-dd'
    });

    // 消费日期选择器
    initDatePicker('ConsumptionDate', {
      format: 'yyyy-MM-dd'
    });

    // 付款日期选择器
    initDatePicker('PaymentDate', {
      format: 'yyyy-MM-dd'
    });
  } catch (error) {
    console.error('初始化日期选择器失败:', error);
  }

  // 初始化工具下拉菜单
  initToolsDropdown();

  // 初始化标签页切换
  initTabSwitching();

  // 初始化模态框关闭事件
  initModalEvents();

  // 从Chrome存储加载Checkout数据
  chrome.storage.local.get('Checkout', (data) => {
    if (data.Checkout) {
      Object.assign(Checkout, data.Checkout);
    }
  });

  // 从Chrome存储加载options数据并初始化酒店信息
  chrome.storage.local.get('options', (data) => {
    if (data.options) {
      Object.assign(options, data.options);
    }

    // 设置员工信息
    document.getElementById('StaffAD').value = options.Staff[0].StaffName || '';

    // 初始化消费类型下拉菜单
    const consumptionTypeSelect = document.getElementById('ConsumptionType');
    if (consumptionTypeSelect) {
      for (let i = 0; i < options.Consumption.length; i++) {
        consumptionTypeSelect.appendChild(createOption(options.Consumption[i], options.Consumption[i]));
      }
    }

    // 初始化付款方式下拉菜单
    const paymentTypeSelect = document.getElementById('PaymentType');
    if (paymentTypeSelect) {
      for (let i = 0; i < options.Payment.length; i++) {
        paymentTypeSelect.appendChild(createOption(options.Payment[i], options.Payment[i]));
      }
    }

    // 绑定事件处理函数
  bindEventHandlers();

  // 初始化引导功能
  initDriverGuide();
});

/**
 * 初始化引导功能
 */
function initDriverGuide() {
  // 添加全局函数，允许用户通过控制台或按钮显示引导
  window.showCheckoutGuide = () => {
    // 创建driver实例并显示引导
    const newDriver = driver({
      showProgress: true,
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      doneBtnText: '完成',
      steps: [
        {
          element: '#CustomerName',
          popover: {
            title: '客人姓名',
            description: '在左侧表单区域填写客人姓名，多个姓名之间用空格隔开',
            position: 'right'
          }
        },
        {
          element: '#StaffAD',
          popover: {
            title: '收款人AD',
            description: '填写收款人姓名或AD，默认已设置可不填',
            position: 'bottom-right'
          }
        },
        {
          element: '#PrintDate',
          popover: {
            title: '打印时间',
            description: '设置结账单的打印日期，可不填，会跟随消费账项日期递增',
            position: 'bottom-right'
          }
        },
        {
          element: '#CustomNum',
          popover: {
            title: '自定义单号',
            description: '可设置自定义结账单号，不填则随机8位数字',
            position: 'bottom-right'
          }
        },
        {
          element: '#consumptionTab',
          popover: {
            title: '消费账项',
            description: '在这里添加客人的消费记录',
            position: 'bottom'
          }
        },
        {
          element: '#Consumption',
          popover: {
            title: '消费账项编辑',
            description: '在此区域可以添加、删除、修改客人的消费记录',
            position: 'bottom-right'
          }
        },
        {
          element: '#ConsumptionOperate',
          popover: {
            title: '添加消费',
            description: '填写完消费信息后，点击此按钮添加到消费列表',
            position: 'left'
          }
        },
        {
          element: '#paymentTab',
          popover: {
            title: '付款账项',
            description: '切换到此标签页，添加客人的付款记录',
            position: 'bottom'
          }
        },
        {
          element: '#PrintPreview',
          popover: {
            title: '预览按钮',
            description: '所有信息填写完毕后，点击预览按钮查看结账单效果',
            position: 'left'
          }
        },
        {
          element: '#ClearPrintFrom',
          popover: {
            title: '清空按钮',
            description: '如果需要重新填写，可以点击此按钮清空所有内容',
            position: 'right'
          }
        }
      ],
      onDestroy: () => {
        // 引导结束后，记录引导已显示
        chrome.storage.local.set({ 'checkoutGuideShown': true });
      }
    });
    newDriver.drive();
  };
  
  // 为问号按钮添加点击事件，显示引导
  document.getElementById('guideButton').addEventListener('click', function() {
    showCheckoutGuide();
  });
  
  // 已关闭自动触发引导功能，仅保留手动触发
}
});

/**
 * 创建下拉菜单选项
 * @param {string} value - 选项值
 * @param {string} text - 选项文本
 * @returns {HTMLOptionElement} 选项元素
 */
function createOption(value, text) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  return option;
}

// 初始化工具下拉菜单
function initToolsDropdown() {
  const toolsDropdown = document.getElementById('toolsDropdown');
  const toolsMenu = document.getElementById('toolsMenu');

  if (toolsDropdown) {
    toolsDropdown.addEventListener('click', function (event) {
      event.stopPropagation();
      if (toolsMenu) {
        toolsMenu.classList.toggle('hidden');
      }
    });
  }

  // 点击其他地方关闭下拉菜单
  document.addEventListener('click', function () {
    if (toolsMenu) {
      toolsMenu.classList.add('hidden');
    }
  });
}

// 初始化标签页切换
function initTabSwitching() {
  const consumptionTab = document.getElementById('consumptionTab');
  const paymentTab = document.getElementById('paymentTab');
  const consumptionContent = document.getElementById('Consumption');
  const paymentContent = document.getElementById('Payment');

  if (consumptionTab && paymentTab && consumptionContent && paymentContent) {
    consumptionTab.addEventListener('click', function () {
      // 激活消费账项标签
      consumptionTab.classList.add('border-blue-500', 'text-blue-600');
      consumptionTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
      // 取消激活付款账项标签
      paymentTab.classList.remove('border-blue-500', 'text-blue-600');
      paymentTab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
      // 显示消费账项内容，隐藏付款账项内容
      consumptionContent.classList.remove('hidden');
      paymentContent.classList.add('hidden');
    });

    paymentTab.addEventListener('click', function () {
      // 激活付款账项标签
      paymentTab.classList.add('border-blue-500', 'text-blue-600');
      paymentTab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
      // 取消激活消费账项标签
      consumptionTab.classList.remove('border-blue-500', 'text-blue-600');
      consumptionTab.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
      // 显示付款账项内容，隐藏消费账项内容
      paymentContent.classList.remove('hidden');
      consumptionContent.classList.add('hidden');
    });
  }
}

// 初始化模态框事件
function initModalEvents() {
  // 默认模态框
  const defaultModal = document.getElementById('DefaultModal');
  const closeDefaultModal = document.getElementById('DefaultModalCloseBtn');
  const confirmDefaultModal = document.getElementById('DefaultModalConfirmBtn');

  // 为关闭按钮添加事件监听
  if (closeDefaultModal && defaultModal) {
    closeDefaultModal.addEventListener('click', function () {
      defaultModal.classList.add('hidden');
    });
  }

  // 为确认按钮添加事件监听
  if (confirmDefaultModal && defaultModal) {
    confirmDefaultModal.addEventListener('click', function () {
      defaultModal.classList.add('hidden');
    });
  }

  // 预览模态框
  const previewModal = document.getElementById('PreviewModal');
  const closePreviewModal = document.getElementById('ClosePreviewModal');
  const cancelPrintPreview = document.getElementById('CancelPrintPreview');

  if (closePreviewModal) {
    closePreviewModal.addEventListener('click', function () {
      previewModal.classList.add('hidden');
      destroyIframe();
    });
  }

  if (cancelPrintPreview) {
    cancelPrintPreview.addEventListener('click', function () {
      previewModal.classList.add('hidden');
      destroyIframe();
    });
  }
}

// 从存储加载数据
function loadData() {
  // 加载结账数据
  chrome.storage.local.get('Checkout', (data) => {
    if (data.Checkout) {
      Object.assign(Checkout, data.Checkout);
    }
  });

  // 加载选项数据
  chrome.storage.local.get('options', (data) => {
    if (data.options) {
      Object.assign(options, data.options);
      // 填充表单数据
      if (options.Staff && options.Staff.length > 0) {
        document.getElementById('StaffAD').value = options.Staff[0].StaffName;
      }

      // 填充消费类型
      const consumptionTypeSelect = document.getElementById('ConsumptionType');
      consumptionTypeSelect.innerHTML = '';
      if (options.Consumption && options.Consumption.length > 0) {
        options.Consumption.forEach(item => {
          const option = document.createElement('option');
          option.value = item;
          option.textContent = item;
          consumptionTypeSelect.appendChild(option);
        });
      }

      // 填充付款方式
      const paymentTypeSelect = document.getElementById('PaymentType');
      paymentTypeSelect.innerHTML = '';
      if (options.Payment && options.Payment.length > 0) {
        options.Payment.forEach(item => {
          const option = document.createElement('option');
          option.value = item;
          option.textContent = item;
          paymentTypeSelect.appendChild(option);
        });
      }
    }
  });

  // 加载模板数据
  loadTemplateData();
}

// 加载模板数据 - 返回Promise以便更好地处理异步加载
function loadTemplateData() {
  return new Promise((resolve, reject) => {
    const CheckoutContent = document.getElementById('CheckoutContent');
    
    // 确保CheckoutContent元素存在
    if (!CheckoutContent) {
      const error = new Error('未找到CheckoutContent元素');
      console.error(error);
      reject(error);
      return;
    }
    
    // 读取模板配置文件
    const templateUrl = chrome.runtime.getURL('src/checkout/Template/index.json');
    fetch(templateUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('网络响应错误: ' + response.status);
        }
        return response.json();
      })
      .then(templates => {
        // 清空内容
        CheckoutContent.innerHTML = '';

        // 处理模板数据
        for (const [category, templateList] of Object.entries(templates)) {
          // 创建分类div
          const div = document.createElement('div');
          div.className = 'mb-4';

          // 创建分类标题
          const h3 = document.createElement('p');
          h3.className = 'font-medium text-gray-700 mb-2';
          h3.textContent = category;
          div.appendChild(h3);

          // 遍历选项
          templateList.forEach(template => {
            // 创建label元素
            const label = document.createElement('label');
            label.className = 'inline-flex items-center mr-4 mb-2';

            // 创建input元素
            const input = document.createElement('input');
            input.type = 'radio';
            input.className = 'form-radio text-blue-600';
            input.id = `${category}_${template.name}`;
            input.name = 'Checkoutradio';
            input.value = `${category}/${template.name}`;

            // 添加label文本
            const span = document.createElement('span');
            span.className = 'ml-2 text-sm text-gray-700';
            span.textContent = template.name;

            // 组装元素
            label.appendChild(input);
            label.appendChild(span);
            div.appendChild(label);
          });

          // 添加到容器
          CheckoutContent.appendChild(div);
        }

        // 默认选中第一个选项
        const firstRadio = CheckoutContent.querySelector('input[type="radio"]');
        if (firstRadio) {
          firstRadio.checked = true;
        }

        // 监听模板选择变化
        const radioButtons = CheckoutContent.querySelectorAll('input[type="radio"][name="Checkoutradio"]');
        radioButtons.forEach(radio => {
          radio.addEventListener('change', function () {
            document.getElementById('previewCheckout').innerHTML = '';
            createTemplatePreview(this.value);
          });
        });
        
        // 解析成功，调用resolve
        resolve();
      })
      .catch(error => {
        console.error('加载模板数据失败:', error);
        showModal('错误', '加载模板数据失败，请刷新页面重试');
        reject(error);
      });
  });
}

// 创建模板预览
function createTemplatePreview(templatePath) {
  const previewContainer = document.getElementById('previewCheckout');
  
  // 保存当前结账数据到chrome.storage.local，以便模板文件可以访问
  chrome.storage.local.set({ Checkout: Checkout, options: options }, () => {
    // 创建iframe用于预览模板
    const iframe = document.createElement('iframe');
    const templateHtmlUrl = chrome.runtime.getURL(`src/checkout/Template/${templatePath}/index.html`);
    iframe.src = templateHtmlUrl;
    iframe.className = 'w-full border border-gray-200 rounded-lg';
    iframe.style.minHeight = '600px';
    iframe.onload = function() {
      // 确保模板正确加载
      console.log('模板加载完成:', templatePath);
    };
    iframe.onerror = function() {
      console.error('模板加载失败:', templatePath);
      showModal('错误', '模板加载失败，请选择其他模板或刷新页面重试');
    };
    
    previewContainer.appendChild(iframe);
  });
}

// 创建模拟预览（备用函数，当模板加载失败时使用）
function createMockPreview(templateValue) {
  const previewContainer = document.getElementById('previewCheckout');
  const previewDiv = document.createElement('div');
  previewDiv.className = 'border border-gray-200 rounded-lg p-4 bg-white';
  previewDiv.innerHTML = `
    <h2 class="text-center text-xl font-bold mb-4">结账单预览 - ${templateValue}</h2>
    <div class="mb-2"><strong>客人姓名：</strong>${document.getElementById('CustomerName').value || '未填写'}</div>
    <div class="mb-2"><strong>收款人AD：</strong>${document.getElementById('StaffAD').value || '未填写'}</div>
    <div class="mb-2"><strong>打印时间：</strong>${document.getElementById('PrintDate').value}</div>
    <div class="mb-4"><strong>单号：</strong>${document.getElementById('CustomNum').value || '系统生成'}</div>
    
    <h3 class="text-lg font-semibold mb-2">消费明细</h3>
    <div class="border border-gray-200 rounded-md mb-4 overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
            <th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
            <th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">房间</th>
            <th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${getConsumptionTableRows()}
        </tbody>
      </table>
    </div>
    
    <h3 class="text-lg font-semibold mb-2">付款明细</h3>
    <div class="border border-gray-200 rounded-md overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
            <th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">方式</th>
            <th class="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${getPaymentTableRows()}
        </tbody>
      </table>
    </div>
  `;
  previewContainer.appendChild(previewDiv);
}

// 获取消费表格行
function getConsumptionTableRows() {
  const tbody = document.getElementById('ConsumptionTableBody');
  if (!tbody || tbody.children.length === 0) {
    return '<tr><td colspan="4" class="px-4 py-2 text-center text-gray-500">暂无消费记录</td></tr>';
  }

  let rows = '';
  for (let i = 0; i < tbody.children.length; i++) {
    const row = tbody.children[i];
    const cells = row.children;
    rows += `
      <tr>
        <td class="px-4 py-2 text-sm text-gray-900">${cells[0].textContent}</td>
        <td class="px-4 py-2 text-sm text-gray-900">${cells[1].textContent}</td>
        <td class="px-4 py-2 text-sm text-gray-900">${cells[2].textContent}</td>
        <td class="px-4 py-2 text-sm text-gray-900">${cells[3].textContent}</td>
      </tr>
    `;
  }

  return rows;
}

// 获取付款表格行
function getPaymentTableRows() {
  const tbody = document.getElementById('PaymentTableBody');
  if (!tbody || tbody.children.length === 0) {
    return '<tr><td colspan="3" class="px-4 py-2 text-center text-gray-500">暂无付款记录</td></tr>';
  }

  let rows = '';
  for (let i = 0; i < tbody.children.length; i++) {
    const row = tbody.children[i];
    const cells = row.children;
    rows += `
      <tr>
        <td class="px-4 py-2 text-sm text-gray-900">${cells[0].textContent}</td>
        <td class="px-4 py-2 text-sm text-gray-900">${cells[1].textContent}</td>
        <td class="px-4 py-2 text-sm text-gray-900">${cells[2].textContent}</td>
      </tr>
    `;
  }

  return rows;
}

// 绑定事件处理函数
function bindEventHandlers() {
  // 消费账项添加
  const consumptionOperate = document.getElementById('ConsumptionOperate');
  if (consumptionOperate) {
    consumptionOperate.addEventListener('click', addConsumptionRow);
  }

  // 付款账项添加
  const paymentOperate = document.getElementById('PaymentOperate');
  if (paymentOperate) {
    paymentOperate.addEventListener('click', addPaymentRow);
  }

  // 预览按钮
  const printPreview = document.getElementById('PrintPreview');
  if (printPreview) {
    printPreview.addEventListener('click', showPrintPreview);
  }

  // 打印按钮
  const printThis = document.getElementById('PrintThis');
  if (printThis) {
    printThis.addEventListener('click', printDocument);
  }

  // 清空按钮
  const clearPrintFrom = document.getElementById('ClearPrintFrom');
  if (clearPrintFrom) {
    clearPrintFrom.addEventListener('click', clearForm);
  }

  // 日期锁定按钮
  const consumptionDateLock = document.getElementById('ConsumptionDateLock');
  if (consumptionDateLock) {
    consumptionDateLock.addEventListener('click', toggleDateLock);
  }

  const paymentDateLock = document.getElementById('PaymentDateLock');
  if (paymentDateLock) {
    paymentDateLock.addEventListener('click', toggleDateLock);
  }

  // 监听表格删除按钮点击
  document.addEventListener('click', function (event) {
    if (event.target && event.target.classList && event.target.classList.contains('del-link')) {
      deleteTableRow(event.target);
    }
  });
}

// 添加消费账项行
function addConsumptionRow() {
  const date = document.getElementById('ConsumptionDate').value;
  const type = document.getElementById('ConsumptionType').value;
  const room = document.getElementById('ConsumptionRoom').value;
  const amount = document.getElementById('ConsumptionAmount').value;

  if (!date || !type || !room || !amount) {
    //console.log
    console.log('请填写完整信息！');
    showModal('提示', '请填写完整信息！');
    return;
  }

  const tbody = document.getElementById('ConsumptionTableBody');
  const row = document.createElement('tr');
  row.className = 'hover:bg-gray-50 transition-colors';
  row.innerHTML = `
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${date}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${type}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${room}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${amount}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      <button class="text-red-600 hover:text-red-800 del-link">删除</button>
    </td>
  `;

  tbody.appendChild(row);

  // 如果日期未锁定，自动增加一天
  const dateLockBtn = document.getElementById('ConsumptionDateLock');
  if (!dateLockBtn.classList.contains('bg-red-500')) {
    document.getElementById('ConsumptionDate').value = addDay(date, 1);
    document.getElementById('PrintDate').value = document.getElementById('ConsumptionDate').value;
  }
}

// 添加付款账项行
function addPaymentRow() {
  const date = document.getElementById('PaymentDate').value;
  const type = document.getElementById('PaymentType').value;
  const amount = document.getElementById('PaymentAmount').value;

  if (!date || !type || !amount) {
    showModal('提示', '请填写完整信息！');
    console.log('请填写完整信息！');
    return;
  }

  const tbody = document.getElementById('PaymentTableBody');
  const row = document.createElement('tr');
  row.className = 'hover:bg-gray-50 transition-colors';
  row.innerHTML = `
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${date}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${type}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${amount}</td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      <button class="text-red-600 hover:text-red-800 del-link">删除</button>
    </td>
  `;

  tbody.appendChild(row);

  // 如果日期未锁定，自动增加一天
  const dateLockBtn = document.getElementById('PaymentDateLock');
  if (!dateLockBtn.classList.contains('bg-red-500')) {
    document.getElementById('PaymentDate').value = addDay(date, 1);
  }
}

// 删除表格行
function deleteTableRow(button) {
  const row = button.closest('tr');
  row.style.opacity = '0';
  setTimeout(() => {
    row.remove();
  }, 200);
}

// 显示打印预览
function showPrintPreview() {
  const customerName = document.getElementById('CustomerName').value;
  const staffAD = document.getElementById('StaffAD').value;
  const consumptionRows = document.getElementById('ConsumptionTableBody').children.length;

  if (!customerName || !staffAD || consumptionRows === 0) {
    console.log('请填写完整信息！');
    showModal('提示', '请检查并填写完整信息：<br>1.客人姓名<br>2.收款人AD<br>3.消费账项是否有数据？');
    return;
  }

  // 设置结账数据
  CheckoutDataSet();

  // 检查打印日期
  const printDate = document.getElementById('PrintDate').value;
  const checkoutTime = Checkout.CheckoutTime;

  if (new Date(printDate) < new Date(checkoutTime)) {
    console.log('打印日期小于退房日期，请检查打印日期！');
    showModal('提示', '打印日期小于退房日期，请检查打印日期！');
    return;
  }

  // 显示预览模态框
  document.getElementById('PreviewModal').classList.remove('hidden');

  // 重新加载模板数据，确保最新
  loadTemplateData().then(() => {
    // 确保模板数据已加载后再创建预览
    const selectedTemplate = document.querySelector('input[name="Checkoutradio"]:checked');
    if (selectedTemplate) {
      createTemplatePreview(selectedTemplate.value);
    } else {
      console.error('未找到选中的模板');
      showModal('错误', '模板加载失败，请刷新页面重试');
    }
  }).catch(error => {
    console.error('模板加载失败:', error);
    showModal('错误', '模板加载失败，请刷新页面重试');
  });

  // 检查是否有付款账项
  const paymentRows = document.getElementById('PaymentTableBody').children.length;
  if (paymentRows === 0) {
    showTopAlert('提示：如需<strong>自定义单号</strong>和<strong>付款账项</strong>，请不要忘了添加！', 'info');
  }
}

// 打印文档
function printDocument() {
  // 获取预览iframe
  const previewIframe = document.getElementById('previewCheckout').querySelector('iframe');
  
  if (previewIframe) {
    try {
      // 打印iframe内容
      previewIframe.contentWindow.print();
    } catch (error) {
      console.error('打印失败:', error);
      showModal('错误', '打印失败，请重试或使用浏览器打印功能');
      // 降级方案：打印当前预览部分
      window.print();
    }
  } else {
    // 如果没有iframe，使用原始打印方式
    window.print();
  }
}

// 清空表单
function clearForm() {
  document.getElementById('CustomerName').value = '';
  document.getElementById('CustomNum').value = '';
  document.getElementById('ConsumptionRoom').value = '';
  document.getElementById('ConsumptionAmount').value = '';
  document.getElementById('PrintDate').value = nowDate();
  document.getElementById('ConsumptionDate').value = nowDate();
  document.getElementById('PaymentDate').value = nowDate();

  // 清空表格
  document.getElementById('ConsumptionTableBody').innerHTML = '';
  document.getElementById('PaymentTableBody').innerHTML = '';

  // 重置选择框
  document.getElementById('ConsumptionType').selectedIndex = 0;

  // 重置日期锁定按钮
  resetDateLockButtons();
}

// 切换日期锁定状态
function toggleDateLock(event) {
  const button = event.target.closest('button');
  if (button.classList.contains('bg-gray-100')) {
    // 锁定日期
    button.classList.remove('bg-gray-100', 'text-gray-700');
    button.classList.add('bg-red-500', 'text-white');
  } else {
    // 解锁日期
    button.classList.remove('bg-red-500', 'text-white');
    button.classList.add('bg-gray-100', 'text-gray-700');
  }
}

// 重置日期锁定按钮
function resetDateLockButtons() {
  const consumptionLock = document.getElementById('ConsumptionDateLock');
  const paymentLock = document.getElementById('PaymentDateLock');

  if (consumptionLock.classList.contains('bg-red-500')) {
    consumptionLock.classList.remove('bg-red-500', 'text-white');
    consumptionLock.classList.add('bg-gray-100', 'text-gray-700');
  }

  if (paymentLock.classList.contains('bg-red-500')) {
    paymentLock.classList.remove('bg-red-500', 'text-white');
    paymentLock.classList.add('bg-gray-100', 'text-gray-700');
  }
}

// 设置结账数据
function CheckoutDataSet() {
  const consumptionTable = document.getElementById('ConsumptionTableBody');
  const paymentTable = document.getElementById('PaymentTableBody');

  // 设置单号 - 仅传递基础数据，具体格式由各模板实现
  const customNum = document.getElementById('CustomNum').value;
  Checkout.CustomNum = customNum || '';
  // 保留原始酒店编号，供模板使用
  Checkout.HotelNumber = options.Hotel[0].HotelNumber || '';

  // 设置基本信息
  Checkout.CustomerName = document.getElementById('CustomerName').value;
  Checkout.PrintDate = document.getElementById('PrintDate').value;
  Checkout.StaffAD = document.getElementById('StaffAD').value;

  // 处理消费数据
  const consumptionData = [];
  let consumptionTotal = 0;
  let earliestDate = null;
  let latestDate = null;
  let roomNum = '';

  for (let i = 0; i < consumptionTable.children.length; i++) {
    const row = consumptionTable.children[i];
    const cells = row.children;
    const date = cells[0].textContent;
    const type = cells[1].textContent;
    const room = cells[2].textContent;
    const amount = Number(cells[3].textContent);

    consumptionData.push({
      ConsumptionDate: date,
      ConsumptionType: type,
      ConsumptionRoom: room,
      ConsumptionAmount: amount.toString()
    });

    consumptionTotal += amount;

    // 记录最早和最晚日期
    const dateObj = new Date(date);
    if (!earliestDate || dateObj < earliestDate) {
      earliestDate = dateObj;
    }
    if (!latestDate || dateObj > latestDate) {
      latestDate = dateObj;
    }

    // 记录房间号
    if (!roomNum) {
      roomNum = room;
    }
  }

  // 设置入住和退房时间
  Checkout.CheckinTime = earliestDate ? formatDate(earliestDate) : '';
  Checkout.CheckoutTime = latestDate ? formatDate(addDayObj(latestDate, 1)) : '';
  Checkout.RoomNum = roomNum;

  // 处理付款数据
  const paymentData = [];
  let paymentTotal = 0;

  for (let i = 0; i < paymentTable.children.length; i++) {
    const row = paymentTable.children[i];
    const cells = row.children;
    const date = cells[0].textContent;
    const type = cells[1].textContent;
    const amount = Number(cells[2].textContent);

    paymentData.push({
      PaymentDate: date,
      PaymentType: type,
      PaymentAmount: amount.toString()
    });

    paymentTotal += amount;
  }

  // 设置结账数据
  Checkout.CheckoutData = [{ Consumption: consumptionData, Payment: paymentData }];
  Checkout.ConsumptionTotal = consumptionTotal;
  Checkout.PaymentTotal = paymentTotal;

  // 保存到存储
  chrome.storage.local.set({ Checkout: Checkout });
}

// 显示顶部悬浮提示
function showTopAlert(message, type = 'info', duration = 3000) {
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

// 工具函数：销毁iframe
function destroyIframe() {
  const previewContainer = document.getElementById('previewCheckout');
  previewContainer.innerHTML = '';
}