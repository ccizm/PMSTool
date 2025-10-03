/**
 * PMS工具 - 华住结账单打印模板1
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
        // 填充结账信息
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
    // 根据Huazhu模板规则生成订单号
    let orderNumber = Checkout.CustomNum || '';
    const hotelNumber = Checkout.HotelNumber || '';
    const customNum = Checkout.CustomNum || '';
    
    // 判断是否包含自定义单号部分
    if (customNum && !customNum.startsWith('B') && !customNum.endsWith('001')) {
      // 用户填写了自定义单号
      orderNumber = 'B' + hotelNumber + customNum + '001';
    } else if (!orderNumber || orderNumber.startsWith('B') && orderNumber.endsWith('001')) {
      // 使用模板规则重新生成订单号
      orderNumber = 'B' + hotelNumber + Math.random().toString().slice(-8) + '001';
    }
    
    // 填充基本信息
    setElementText("#checkout > div > div:nth-child(2) > div:nth-child(1) > div > div.diana-print-content", orderNumber); // 单号
    setElementText("#checkout > div > div:nth-child(2) > div:nth-child(3) > div > div.diana-print-content", Checkout.RoomNum || ''); // 房号
    setElementText("#checkout > div > div:nth-child(2) > div:nth-child(2) > div > div.diana-print-content", Checkout.CustomerName || ''); // 姓名
    setElementText("#checkout > div > div:nth-child(2) > div:nth-child(4) > div > div.diana-print-content", Checkout.CheckinTime || ''); // 入住时间
    setElementText("#checkout > div > div:nth-child(2) > div:nth-child(5) > div > div.diana-print-content", Checkout.CheckoutTime || ''); // 离店时间
    setElementText("#checkout > div > div:nth-child(2) > div:nth-child(6) > div > div.diana-print-content", Checkout.PrintDate || ''); // 打印时间
    setElementText("#checkout > div > div:nth-child(2) > div:nth-child(7) > div > div.diana-print-content", Checkout.StaffAD || ''); // 收款人

    // 填充总计金额
    setElementText("#checkout > div > div:nth-child(4) > div.el-table__footer-wrapper > table > tbody > tr > td.el-table_44_column_192.is-leaf > div", Checkout.ConsumptionTotal || '0.00');
    setElementText("#checkout > div > div:nth-child(3) > div.el-table__footer-wrapper > table > tbody > tr > td.el-table_43_column_189.is-leaf > div", Checkout.PaymentTotal || '0.00');
  } catch (error) {
    console.error('填充结账信息失败:', error);
  }
}

/**
 * 填充消费和付款表格
 */
function fillTables() {
  try {
    // 填充消费表格
    fillConsumptionTable();
    // 填充付款表格
    fillPaymentTable();
  } catch (error) {
    console.error('填充表格数据失败:', error);
  }
}

/**
 * 填充消费表格
 */
function fillConsumptionTable() {
  const consumptionTable = document.querySelector('.PrintConsumption');
  
  // 检查表格元素是否存在
  if (!consumptionTable) {
    console.error('未找到消费表格元素');
    return;
  }
  
  // 检查是否有消费数据
  if (Checkout.CheckoutData && Checkout.CheckoutData[0] && 
      Checkout.CheckoutData[0].Consumption && Checkout.CheckoutData[0].Consumption.length > 0) {
      
    // 遍历消费数据并添加到表格
    Checkout.CheckoutData[0].Consumption.forEach(consumption => {
      const tr = document.createElement('tr');
      tr.setAttribute('class', 'el-table__row');
      
      // 创建日期单元格
      const dateTd = document.createElement('td');
      dateTd.setAttribute('class', 'el-table_43_column_187');
      dateTd.innerHTML = `<div class="cell">${consumption.ConsumptionDate || ''}</div>`;
      tr.appendChild(dateTd);
      
      // 创建类型和房间单元格
      const typeTd = document.createElement('td');
      typeTd.setAttribute('class', 'el-table_43_column_188');
      typeTd.innerHTML = `<div class="cell">${consumption.ConsumptionType || ''}${consumption.ConsumptionRoom || ''}</div>`;
      tr.appendChild(typeTd);
      
      // 创建金额单元格
      const amountTd = document.createElement('td');
      amountTd.setAttribute('class', 'el-table_43_column_189');
      amountTd.innerHTML = `<div class="cell">${consumption.ConsumptionAmount || '0.00'}</div>`;
      tr.appendChild(amountTd);
      
      // 添加到表格
      consumptionTable.appendChild(tr);
    });
  } else {
    // 没有消费数据时隐藏表格和底部行
    consumptionTable.style.display = 'none';
    const footerRow = document.getElementById('PrintConsumptionFooter');
    if (footerRow) {
      footerRow.style.display = 'none';
    }
  }
}

/**
 * 填充付款表格
 */
function fillPaymentTable() {
  const paymentTable = document.querySelector('.PrintPayment');
  
  // 检查表格元素是否存在
  if (!paymentTable) {
    console.error('未找到付款表格元素');
    return;
  }
  
  // 检查是否有付款数据
  if (Checkout.CheckoutData && Checkout.CheckoutData[0] && 
      Checkout.CheckoutData[0].Payment && Checkout.CheckoutData[0].Payment.length > 0) {
      
    // 遍历付款数据并添加到表格
    Checkout.CheckoutData[0].Payment.forEach(payment => {
      const tr = document.createElement('tr');
      tr.setAttribute('class', 'el-table__row');
      
      // 创建日期单元格
      const dateTd = document.createElement('td');
      dateTd.setAttribute('class', 'el-table_43_column_187');
      dateTd.innerHTML = `<div class="cell">${payment.PaymentDate || ''}</div>`;
      tr.appendChild(dateTd);
      
      // 创建付款方式单元格
      const typeTd = document.createElement('td');
      typeTd.setAttribute('class', 'el-table_43_column_188');
      typeTd.innerHTML = `<div class="cell">${payment.PaymentType || ''}</div>`;
      tr.appendChild(typeTd);
      
      // 创建金额单元格
      const amountTd = document.createElement('td');
      amountTd.setAttribute('class', 'el-table_43_column_189');
      amountTd.innerHTML = `<div class="cell">${payment.PaymentAmount || '0.00'}</div>`;
      tr.appendChild(amountTd);
      
      // 添加到表格
      paymentTable.appendChild(tr);
    });
  } else {
    // 没有付款数据时隐藏表格和底部行
    paymentTable.style.display = 'none';
    const footerRow = document.getElementById('PrintPaymentFooter');
    if (footerRow) {
      footerRow.style.display = 'none';
    }
  }
}

/**
 * 填充酒店信息
 */
function fillHotelInfo() {
  try {
    // 获取酒店信息
    const hotelInfo = options.Hotel && options.Hotel[0] ? options.Hotel[0] : {};
    
    // 填充酒店信息
    setElementText("#checkout > div > div.header.el-row > div.header-hotel", hotelInfo.HotelName || '');
    setElementText("#checkout > div > div:nth-child(7) > div > div:nth-child(1) > span", `地址:${hotelInfo.HotelAddress || ''}`);
    setElementText("#checkout > div > div:nth-child(7) > div > div:nth-child(2) > span", `电话:${hotelInfo.HotelPhone || ''}`);
    setElementText("#checkout > div > div:nth-child(7) > div > div:nth-child(3) > span", `邮编:${hotelInfo.HotelZip || ''}`);
    setElementText("#checkout > div > div:nth-child(7) > div > div:nth-child(4) > span", `传真:${hotelInfo.HotelFax || ''}`);
  } catch (error) {
    console.error('填充酒店信息失败:', error);
  }
}

/**
 * 安全地设置元素文本内容
 * @param {string} selector - CSS选择器
 * @param {string} text - 要设置的文本内容
 */
function setElementText(selector, text) {
  try {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = text;
    }
  } catch (error) {
    console.error(`设置元素(${selector})文本失败:`, error);
  }
}