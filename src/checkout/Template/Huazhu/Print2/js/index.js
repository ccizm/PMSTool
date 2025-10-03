/**
 * PMS工具 - 华住结账单打印模板2
 * 负责加载和显示结账单数据
 * 使用原生JavaScript实现，不依赖jQuery
 */

// 导入公共函数和对象
import { Checkout, options, formatDate } from '../../../../../main.js';

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
    const customNum = Checkout.CustomNum || '';
    const hotelNumber = Checkout.HotelNumber || '';
    let orderNumber = '';
    
    // 提取有效的自定义单号部分（移除酒店编号、B前缀和001后缀）
    let cleanCustomNum = customNum;
    if (cleanCustomNum && hotelNumber && cleanCustomNum.startsWith(hotelNumber)) {
      cleanCustomNum = cleanCustomNum.substring(hotelNumber.length);
    }
    
    // 判断是否包含有效的自定义单号部分
    if (cleanCustomNum && typeof cleanCustomNum === 'string' && cleanCustomNum.trim() && 
        !cleanCustomNum.startsWith('B') && !cleanCustomNum.endsWith('001')) {
      // 用户填写了自定义单号，使用B+酒店编号+自定义部分+001格式
      orderNumber = 'B' + hotelNumber + cleanCustomNum.trim() + '001';
    } else {
      // 使用模板规则重新生成订单号
      const randomPart = Math.floor(10000000 + Math.random() * 90000000); // 生成8位随机数
      orderNumber = 'B' + hotelNumber + randomPart + '001';
    }
    
    // 填充基本信息
    setElementText("body > div > div.Print-info > div:nth-child(1) > span", orderNumber); // 单号
    setElementText("body > div > div.Print-info > div:nth-child(2) > span", Checkout.RoomNum || ''); // 房号
    setElementText("body > div > div.Print-info > div:nth-child(3) > span", Checkout.CustomerName || ''); // 姓名
    setElementText("body > div > div.Print-info > div:nth-child(4) > span", Checkout.CheckinTime || ''); // 入住时间
    setElementText("body > div > div.Print-info > div:nth-child(5) > span", Checkout.CheckoutTime || ''); // 离店时间
    setElementText("body > div > div.Print-info > div:nth-child(6) > span", Checkout.PrintDate || ''); // 打印时间
    setElementText("body > div > div.Print-info > div:nth-child(7) > span", Checkout.StaffAD || ''); // 收款人

    // 填充总计金额
    setElementText("body > div > div.Print-details > table > tbody > tr.Consumptionfooter > td:nth-child(3)", Checkout.ConsumptionTotal || '0.00');
    setElementText("body > div > div.Print-details > table > tbody > tr.Paymenthead > td:nth-child(3)", Checkout.PaymentTotal || '0.00');
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
  const consumptionFooter = document.querySelector('.Consumptionfooter');
  
  // 检查是否有消费数据和元素是否存在
  if (consumptionFooter && Checkout.CheckoutData && Checkout.CheckoutData[0] && 
      Checkout.CheckoutData[0].Consumption && Checkout.CheckoutData[0].Consumption.length > 0) {
      
    // 遍历消费数据并添加到表格
    Checkout.CheckoutData[0].Consumption.forEach(consumption => {
      const tr = document.createElement('tr');
      
      // 创建日期单元格
      const dateTd = document.createElement('td');
      dateTd.textContent = consumption.ConsumptionDate || '';
      tr.appendChild(dateTd);
      
      // 创建类型和房间单元格
      const typeTd = document.createElement('td');
      typeTd.textContent = `${consumption.ConsumptionType || ''}${consumption.ConsumptionRoom || ''}`;
      tr.appendChild(typeTd);
      
      // 创建金额单元格
      const amountTd = document.createElement('td');
      amountTd.textContent = consumption.ConsumptionAmount || '0.00';
      tr.appendChild(amountTd);
      
      // 添加到表格（插入到footer行之前）
      consumptionFooter.parentNode.insertBefore(tr, consumptionFooter);
    });
  } else if (consumptionFooter) {
    // 没有消费数据时隐藏底部行
    consumptionFooter.style.display = 'none';
  }
}

/**
 * 填充付款表格
 */
function fillPaymentTable() {
  const paymentHead = document.querySelector('.Paymenthead');
  
  // 检查是否有付款数据和元素是否存在
  if (paymentHead && Checkout.CheckoutData && Checkout.CheckoutData[0] && 
      Checkout.CheckoutData[0].Payment && Checkout.CheckoutData[0].Payment.length > 0) {
      
    // 遍历付款数据并添加到表格
    Checkout.CheckoutData[0].Payment.forEach(payment => {
      const tr = document.createElement('tr');
      
      // 创建日期单元格
      const dateTd = document.createElement('td');
      dateTd.textContent = payment.PaymentDate || '';
      tr.appendChild(dateTd);
      
      // 创建付款方式单元格
      const typeTd = document.createElement('td');
      typeTd.textContent = payment.PaymentType || '';
      tr.appendChild(typeTd);
      
      // 创建金额单元格
      const amountTd = document.createElement('td');
      amountTd.textContent = payment.PaymentAmount || '0.00';
      tr.appendChild(amountTd);
      
      // 添加到表格（插入到head行之前）
      paymentHead.parentNode.insertBefore(tr, paymentHead);
    });
  } else if (paymentHead) {
    // 没有付款数据时隐藏头部行
    paymentHead.style.display = 'none';
  }
}

/**
 * 填充酒店信息
 */
function fillHotelInfo() {
  try {
    // 获取酒店信息
    const hotelInfo = options.Hotel && options.Hotel[0] ? options.Hotel[0] : {};
    
    // 填充酒店名称到头部标题
    setElementText(".Print-header .title", hotelInfo.HotelName || '华住酒店');
    
    // 填充底部信息
  setElementText(".Print-footer .adress", hotelInfo.HotelAddress || '');
  setElementText(".Print-footer .phone", hotelInfo.HotelPhone || '');
  setElementText(".Print-footer > div:nth-child(3) > span", hotelInfo.HotelZip || '');
  setElementText(".Print-footer > div:nth-child(4) > span", hotelInfo.HotelFax || '');
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