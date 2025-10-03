// 导入公共函数
import { options, nowDate, addDay, showModal, initModal, initDatePicker, toggleDateLock, resetDateLockButton } from '../main.js';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

/**
 * 初始化价格计算器
 */
function initPriceCalculator() {
  // 初始化模态框
  initModal();
  
  // 初始化会员等级
  initVipTypeSelect();
  
  // 初始化日期选择器
  initDatePicker('todayDate', {
    format: 'yyyy-MM-dd',
    value: nowDate(),
    choose: function(dates) {
      console.log('选择的日期:', dates);
    }
  });
  
  // 设置默认日期
  setDefaultDate();
  
  // 绑定事件监听器
  bindEventListeners();
}

/**
 * 初始化会员等级下拉框
 */
function initVipTypeSelect() {
  // 首先尝试从Chrome存储获取数据
  chrome.storage.local.get('options', (data) => {
    // 如果有存储的数据，使用存储的数据
    if (data.options && data.options.Vip && data.options.Vip.length > 0) {
      Object.assign(options, data.options);
    }
    
    // 初始化下拉框（无论是否有存储数据，都使用options中的默认值）
    const vipTypeSelect = document.getElementById('VipType');
    if (vipTypeSelect && options.Vip && options.Vip.length > 0) {
      vipTypeSelect.innerHTML = ''; // 清空现有选项
      options.Vip.forEach(vip => {
        const option = document.createElement('option');
        option.value = vip.VipDiscount;
        option.textContent = vip.VipType;
        vipTypeSelect.appendChild(option);
      });
    }
  });
}

/**
 * 设置默认日期
 */
function setDefaultDate() {
  document.getElementById('todayDate').value = nowDate();
}

/**
 * 绑定事件监听器
 */
function bindEventListeners() {
  // 添加消费选项按钮
  document.getElementById('addCalcOptions').addEventListener('click', handleAddCalcOptions);
  
  // 计算按钮
  document.getElementById('priceCalcSubmit').addEventListener('click', handlePriceCalcSubmit);
  
  // 清空按钮
  document.getElementById('ClearCalcFrom').addEventListener('click', handleClearForm);
  
  // 日期锁定按钮点击事件
  document.getElementById('todayDateLock').addEventListener('click', handleToggleDateLock);
  
  // 删除行事件委托
  document.addEventListener('click', function(event) {
    if (event.target.closest('.del-link')) {
      handleDeleteRow(event);
    }
  });
}

/**
 * 处理添加计算选项
 */
function handleAddCalcOptions() {
  const roomPrice = document.getElementById('RoomPrice').value;
  
  // 判断是否填写价格
  if (roomPrice) {
    const additionalDiscount = document.getElementById('additionalDiscount').value;
    const couponAmount = document.getElementById('couponAmount').value;
    
    // 判断折上折与优惠券冲突
    if (additionalDiscount && couponAmount) {
      showModal('提示', '折上折与优惠券无法同享！');
      return;
    }
    
    // 获取会员类型信息
    const vipTypeSelect = document.getElementById('VipType');
    const selectedVipText = vipTypeSelect.options[vipTypeSelect.selectedIndex].text;
    const selectedVipValue = vipTypeSelect.value;
    
    // 获取当天日期
    const todayDate = document.getElementById('todayDate').value;
    
    // 获取其他表单值
    const additionalFees = document.getElementById('additionalFees').value;
    
    // 添加表格行
    addTableRow(selectedVipText, selectedVipValue, todayDate, roomPrice, 
                additionalDiscount, couponAmount, additionalFees);
    
    // 如果日期未锁定，自动递增日期
    const dateLockBtn = document.getElementById('todayDateLock');
    if (dateLockBtn && !dateLockBtn.classList.contains('bg-red-500')) {
      document.getElementById('todayDate').value = addDay(todayDate, 1);
    }
  } else {
    showModal('提示', '请填写房型门市价！');
  }
}

/**
 * 添加表格行
 */
function addTableRow(vipTypeText, vipTypeValue, date, price, discount, coupon, fees) {
  const tableBody = document.querySelector('#priceTable tbody');
  const row = document.createElement('tr');
  
  row.innerHTML = `
    <td discount="${vipTypeValue}">${vipTypeText}</td>
    <td>${date}</td>
    <td>${price}</td>
    <td>${discount}</td>
    <td>${coupon}</td>
    <td>${fees}</td>
    <td><button class="btn btn-link btn-xs del-link">删除</button></td>
  `;
  
  tableBody.appendChild(row);
}

/**
 * 处理价格计算
 */
function handlePriceCalcSubmit() {
  const priceTableRows = document.querySelectorAll('#priceTable tbody tr');
  
  if (priceTableRows.length > 0) {
    // 清空结果表格
    const resultTableBody = document.querySelector('#resultTable tbody');
    resultTableBody.innerHTML = '';
    
    // 获取表格数据并计算结果
    const resultData = getTableJson();
    let totalMoney2 = 0;
    
    // 填充结果表格
    resultData.forEach(item => {
      const tr = document.createElement('tr');
      const dateTd = document.createElement('td');
      const priceTd = document.createElement('td');
      
      dateTd.textContent = item.Date;
      priceTd.textContent = item.Price;
      
      tr.appendChild(dateTd);
      tr.appendChild(priceTd);
      resultTableBody.appendChild(tr);
      
      totalMoney2 += Number(item.Price);
    });
    
    // 显示优惠后总金额
    document.getElementById('totalMoney2').textContent = totalMoney2;
  } else {
    showModal('提示', '请检查表格内是否有数据？');
  }
}

/**
 * 清空表单
 */
function handleClearForm() {
  console.log('执行清空表单操作');
  
  // 重置会员选择
  const vipTypeSelect = document.getElementById('VipType');
  if (vipTypeSelect) {
    if (vipTypeSelect.options.length > 0) {
      vipTypeSelect.options[0].selected = true;
    }
  } else {
    console.warn('未找到会员选择下拉框');
  }
  
  // 重置日期
  const todayDateInput = document.getElementById('todayDate');
  if (todayDateInput) {
    todayDateInput.value = nowDate();
  } else {
    console.warn('未找到日期输入框');
  }
  
  // 清空输入框
  const inputIds = ['RoomPrice', 'additionalDiscount', 'couponAmount', 'additionalFees'];
  inputIds.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.value = '';
    } else {
      console.warn(`未找到输入框: ${id}`);
    }
  });
  
  // 清空表格
  const priceTableBody = document.querySelector('#priceTable tbody');
  const resultTableBody = document.querySelector('#resultTable tbody');
  if (priceTableBody) {
    priceTableBody.innerHTML = '';
  } else {
    console.warn('未找到价格表格');
  }
  if (resultTableBody) {
    resultTableBody.innerHTML = '';
  } else {
    console.warn('未找到结果表格');
  }
  
  // 重置金额显示
  const totalMoney1 = document.getElementById('totalMoney1');
  const totalMoney2 = document.getElementById('totalMoney2');
  if (totalMoney1) {
    totalMoney1.textContent = '/';
  } else {
    console.warn('未找到总金额显示元素');
  }
  if (totalMoney2) {
    totalMoney2.textContent = '/';
  } else {
    console.warn('未找到优惠后金额显示元素');
  }
  
  // 重置日期锁定按钮状态 - 使用main.js中的公共函数
  resetDateLockButton('todayDateLock');
}

/**
 * 切换日期锁定状态（内部封装，保持原有接口兼容性）
 */
function handleToggleDateLock() {
  // 创建一个模拟事件对象，用于传递给公共函数
  const event = {
    target: document.getElementById('todayDateLock')
  };
  
  // 调用main.js中的公共函数
  toggleDateLock(event);
}

/**
 * 处理删除表格行
 */
function handleDeleteRow(event) {
  const deleteButton = event.target.closest('.del-link');
  const row = deleteButton.closest('tr');
  
  // 添加淡出动画
  row.style.transition = 'opacity 0.2s ease-out';
  row.style.opacity = '0';
  
  setTimeout(() => {
    row.remove();
  }, 200);
}

/**
 * 获取表格数据并计算结果
 */
function getTableJson() {
  const tableDataObj = document.getElementById('priceTable');
  let totalMoney1 = 0;
  let tableDataToJSON = '';
  
  // 获取原始表格数据
  for (let i = 1; i < tableDataObj.rows.length; i++) {
    const row = tableDataObj.rows[i];
    const vipDiscount = row.cells[0].getAttribute('discount');
    const todayDate = row.cells[1].textContent;
    const roomPrice = row.cells[2].textContent;
    const additionalDiscount = row.cells[3].textContent;
    const couponAmount = row.cells[4].textContent;
    const additionalFees = row.cells[5].textContent;
    
    // 计算总金额
    totalMoney1 += Number(roomPrice);
    
    // 构建JSON数据
    tableDataToJSON += `{"VipDiscount":"${vipDiscount}","todayDate":"${todayDate}","RoomPrice":"${roomPrice}","additionalDiscount":"${additionalDiscount}","couponAmount":"${couponAmount}","additionalFees":"${additionalFees}"},`;
  }
  
  // 更新总金额显示
  document.getElementById('totalMoney1').textContent = totalMoney1;
  
  // 处理JSON字符串并解析
  if (tableDataToJSON) {
    tableDataToJSON = tableDataToJSON.substring(0, tableDataToJSON.lastIndexOf(','));
    const tableData = JSON.parse('[' + tableDataToJSON + ']');
    
    // 计算优惠后的价格
    let calcData = '';
    tableData.forEach(item => {
      let finalPrice;
      if (!item.additionalDiscount) {
        // 没有折上折的情况
        finalPrice = Math.round((Number(item.RoomPrice) * Number(item.VipDiscount / 100) - Number(item.couponAmount) + Number(item.additionalFees)));
      } else {
        // 有折上折的情况
        finalPrice = Math.round((Number(item.RoomPrice) * Number(item.VipDiscount * Number(item.additionalDiscount) / 10000) + Number(item.additionalFees)));
      }
      
      calcData += `{"Date":"${item.todayDate}","Price":"${finalPrice}"},`;
    });
    
    // 处理计算结果并返回
    if (calcData) {
      calcData = calcData.substring(0, calcData.lastIndexOf(','));
      return JSON.parse('[' + calcData + ']');
    }
  }
  
  return [];
}

// 导出公共函数，便于其他组件调用
window.PriceCalcUtils = {
  init: initPriceCalculator,
  calculatePrice: handlePriceCalcSubmit,
  clearForm: handleClearForm,
  toggleDateLock: toggleDateLock
};

// 当DOM加载完成后初始化价格计算器
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    initPriceCalculator();
    initDriverGuide();
  });
} else {
  initPriceCalculator();
  initDriverGuide();
}

/**
 * 初始化引导功能
 */
function initDriverGuide() {
  // 添加全局函数，允许用户通过控制台或按钮显示引导
  window.showPriceCalcGuide = () => {
    // 创建driver实例并显示引导
    const newDriver = driver({
      showProgress: true,
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      doneBtnText: '完成',
      steps: [
        {
          element: '#VipType',
          popover: {
            title: '选择会员',
            description: '请选择客人的会员等级，系统会自动应用相应的折扣',
            position: 'bottom-right'
          }
        },
        {
          element: '#todayDate',
          popover: {
            title: '当天日期',
            description: '选择计算价格的日期，点击左侧锁图标可以锁定日期',
            position: 'bottom-right'
          }
        },
        {
          element: '#RoomPrice',
          popover: {
            title: '房型门市价',
            description: '输入房型的基础门市价格',
            position: 'bottom-right'
          }
        },
        {
          element: '#additionalDiscount',
          popover: {
            title: '额外折扣',
            description: '输入额外的折扣比例（例如88表示8.8折）',
            position: 'bottom-right'
          }
        },
        {
          element: '#couponAmount',
          popover: {
            title: '优惠券立减',
            description: '输入优惠券的立减金额，与额外折扣无法同时使用',
            position: 'bottom-right'
          }
        },
        {
          element: '#addCalcOptions',
          popover: {
            title: '添加按钮',
            description: '点击此按钮将当前配置添加到计算表格中',
            position: 'left'
          }
        },
        {
          element: '#priceCalcSubmit',
          popover: {
            title: '预览按钮',
            description: '所有配置添加完成后，点击此按钮计算并预览结果',
            position: 'left'
          }
        },
        {
          element: '#ClearCalcFrom',
          popover: {
            title: '清空按钮',
            description: '如果需要重新填写，可以点击此按钮清空所有内容',
            position: 'right'
          }
        }
      ],
      onDestroy: () => {
        // 引导结束后，记录引导已显示
        chrome.storage.local.set({ 'priceCalcGuideShown': true });
      }
    });
    newDriver.drive();
  };
  
  // 为问号按钮添加点击事件，显示引导
  document.getElementById('guideButton').addEventListener('click', function() {
    showPriceCalcGuide();
  });
  
  // 已关闭自动触发引导功能，仅保留手动触发
}