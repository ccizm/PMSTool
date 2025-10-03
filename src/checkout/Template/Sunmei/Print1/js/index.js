/**
 * PMS工具 - Sunmei Print1结账单打印模板
 * 负责加载和显示结账单数据
 * 使用原生JavaScript实现，不依赖jQuery
 */

// 导入公共函数和对象
import { Checkout, options } from '../../../../../main.js';

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
  // 初始化页面数据
  initPageData();
});

/**
 * 初始化页面数据
 * 从Chrome存储加载Checkout和options数据并填充到页面
 */
function initPageData() {
  // 加载结账数据
  chrome.storage.local.get(['Checkout', 'options'], (data) => {
    try {
      // 更新Checkout对象
      if (data.Checkout) {
        Object.assign(Checkout, data.Checkout);
        // 填充结账基本信息
        fillCheckoutInfo();
        // 填充消费和付款表格
        fillTables();
      }
      
      // 更新options对象
      if (data.options) {
        Object.assign(options, data.options);
        // 填充酒店信息
        fillHotelInfo();
      }
    } catch (error) {
      console.error('初始化页面数据失败:', error);
    }
  });
}

/**
 * 填充结账基本信息
 */
function fillCheckoutInfo() {
  try {
    // 根据Sunmei模板规则生成订单号
    const customNum = Checkout.CustomNum || '';
    const hotelNumber = Checkout.HotelNumber || '';
    let orderNumber = '';
    
    // 判断是否包含有效的自定义单号部分
    if (customNum && typeof customNum === 'string' && customNum.trim()) {
      // 用户填写了自定义单号，使用JD+酒店编号+自定义部分+01格式
      orderNumber = 'JD' + hotelNumber + customNum.trim() + '01';
    } else {
      // 使用模板规则重新生成订单号
      orderNumber = 'JD' + hotelNumber + Math.random().toString().slice(-10) + '01';
    }
    
    // 使用ID填充基本信息
    setElementText("orderNumber", orderNumber); // 订单号
    setElementText("customerName", Checkout.CustomerName || ''); // 客人姓名
    setElementText("checkinTime", Checkout.CheckinTime || ''); // 入住时间
    setElementText("checkoutTime", Checkout.CheckoutTime || ''); // 离店时间
    setElementText("printTime", Checkout.PrintDate || ''); // 打印时间
    setElementText("roomNumber", Checkout.RoomNum || ''); // 房号
    setElementText("staffName", Checkout.StaffAD || ''); // 打印人
  } catch (error) {
    console.error('填充结账信息失败:', error);
  }
}

/**
 * 填充消费和付款表格
 */
function fillTables() {
  try {
    // 首先清空原有的静态数据行
    clearStaticRows();
    
    // 填充消费表格
    fillConsumptionTable();
    // 填充付款表格
    fillPaymentTable();
    
    // 更新合计金额
    updateTotals();
  } catch (error) {
    console.error('填充表格数据失败:', error);
  }
}

/**
 * 清空静态数据行
 */
function clearStaticRows() {
  try {
    const container = document.getElementById('printBox');
    const tableHeader = document.getElementById('tableHeader');
    const consumptionTotalRow = document.getElementById('consumptionTotalRow');
    const paymentTotalRow = document.getElementById('paymentTotalRow');
    
    if (!container || !tableHeader || !consumptionTotalRow || !paymentTotalRow) return;
    
    // 找出表头和消费合计行之间的所有行并删除
    let currentRow = tableHeader.nextElementSibling;
    while (currentRow && currentRow !== consumptionTotalRow) {
      const nextRow = currentRow.nextElementSibling;
      // 只删除带有data-v-1baf844f属性的div元素
      if (currentRow.hasAttribute('data-v-1baf844f') && currentRow.tagName.toLowerCase() === 'div') {
        container.removeChild(currentRow);
      }
      currentRow = nextRow;
    }
    
    // 找出消费合计行和收款合计行之间的所有行并删除
    currentRow = consumptionTotalRow.nextElementSibling;
    while (currentRow && currentRow !== paymentTotalRow) {
      const nextRow = currentRow.nextElementSibling;
      // 只删除带有data-v-1baf844f属性的div元素
      if (currentRow.hasAttribute('data-v-1baf844f') && currentRow.tagName.toLowerCase() === 'div') {
        container.removeChild(currentRow);
      }
      currentRow = nextRow;
    }
  } catch (error) {
    console.error('清空静态行失败:', error);
  }
}

/**
 * 填充消费表格
 */
function fillConsumptionTable() {
  try {
    const tableHeader = document.getElementById('tableHeader');
    const consumptionTotalRow = document.getElementById('consumptionTotalRow');
    
    if (!tableHeader || !consumptionTotalRow) return;
    
    // 检查是否有消费数据
    if (Checkout.CheckoutData && Checkout.CheckoutData[0] && 
        Checkout.CheckoutData[0].Consumption && Checkout.CheckoutData[0].Consumption.length > 0) {
      
      // 遍历消费数据并添加到表格
      Checkout.CheckoutData[0].Consumption.forEach(consumption => {
        const row = createDataRow(consumption.ConsumptionRoom, consumption.ConsumptionType, consumption.ConsumptionAmount);
        // 插入到表头行之后
        tableHeader.parentNode.insertBefore(row, tableHeader.nextSibling);
      });
    }
  } catch (error) {
    console.error('填充消费表格失败:', error);
  }
}

/**
 * 填充付款表格
 */
function fillPaymentTable() {
  try {
    const consumptionTotalRow = document.getElementById('consumptionTotalRow');
    const paymentTotalRow = document.getElementById('paymentTotalRow');
    
    if (!consumptionTotalRow || !paymentTotalRow) return;
    
    // 检查是否有付款数据
    if (Checkout.CheckoutData && Checkout.CheckoutData[0] && 
        Checkout.CheckoutData[0].Payment && Checkout.CheckoutData[0].Payment.length > 0) {
      
      // 遍历付款数据并添加到表格
      Checkout.CheckoutData[0].Payment.forEach(payment => {
        const row = createDataRow(payment.PaymentRoom || Checkout.RoomNum, payment.PaymentType, payment.PaymentAmount);
        // 插入到消费合计行之后
        consumptionTotalRow.parentNode.insertBefore(row, consumptionTotalRow.nextSibling);
      });
    }
  } catch (error) {
    console.error('填充付款表格失败:', error);
  }
}

/**
 * 创建数据行
 * @param {string} roomNum - 房间号
 * @param {string} itemType - 项目类型
 * @param {string} amount - 金额
 * @returns {HTMLElement} - 创建的数据行元素
 */
function createDataRow(roomNum, itemType, amount) {
  const row = document.createElement('div');
  row.setAttribute('data-v-1baf844f', '');
  row.style.display = 'flex';
  row.style.padding = '5px 0px';
  
  // 房间号单元格
  const roomDiv = document.createElement('div');
  roomDiv.setAttribute('data-v-1baf844f', '');
  roomDiv.style.flex = '1 1 0%';
  roomDiv.textContent = roomNum || '';
  row.appendChild(roomDiv);
  
  // 项目类型单元格
  const typeDiv = document.createElement('div');
  typeDiv.setAttribute('data-v-1baf844f', '');
  typeDiv.style.flex = '1 1 0%';
  typeDiv.style.textAlign = 'center';
  typeDiv.textContent = itemType || '';
  row.appendChild(typeDiv);
  
  // 金额单元格
  const amountDiv = document.createElement('div');
  amountDiv.setAttribute('data-v-1baf844f', '');
  amountDiv.style.flex = '1 1 0%';
  amountDiv.style.textAlign = 'right';
  amountDiv.textContent = amount || '0.00';
  row.appendChild(amountDiv);
  
  return row;
}

/**
 * 更新合计金额
 */
function updateTotals() {
  try {
    // 使用ID更新合计金额
    setElementText("consumptionTotal", Checkout.ConsumptionTotal || '0.00');
    setElementText("paymentTotal", Checkout.PaymentTotal || '0.00');
  } catch (error) {
    console.error('更新合计金额失败:', error);
  }
}

/**
 * 填充酒店信息
 */
function fillHotelInfo() {
  try {
    // 获取酒店信息
    const hotelInfo = options.Hotel && options.Hotel[0] ? options.Hotel[0] : {};
    
    // 使用ID填充酒店名称
    setElementText("hotelName", hotelInfo.HotelName || '');
  } catch (error) {
    console.error('填充酒店信息失败:', error);
  }
}

/**
 * 安全地设置元素文本内容
 * @param {string} id - 元素ID
 * @param {string} text - 要设置的文本内容
 */
function setElementText(id, text) {
  try {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  } catch (error) {
    console.error(`设置元素(ID:${id})文本失败:`, error);
  }
}