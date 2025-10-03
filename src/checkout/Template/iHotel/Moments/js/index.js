/**
 * PMS工具 - iHotel Moments结账单打印模板
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
    // 根据iHotel模板规则生成确认号
    let confirmationNumber = Checkout.CustomNum || '';
    const customNum = Checkout.CustomNum || '';
    const hotelNumber = Checkout.HotelNumber || '';
    
    // 判断是否包含自定义确认号部分
    if (customNum && customNum.length === 8 && !customNum.startsWith('B') && !customNum.endsWith('001')) {
      // 使用用户提供的8位确认号
      confirmationNumber = customNum;
    } else {
      // 生成8位随机确认号
      confirmationNumber = Math.random().toString().slice(-8);
    }
    
    // 填充基本信息 - 使用ID选择器简化
    setElementText("#guestName", Checkout.CustomerName || ''); // 姓名
    setElementText("#confirmNumber", confirmationNumber); // 确认号
    setElementText("#roomNumber", Checkout.RoomNum || ''); // 房号
    setElementText("#cashier", Checkout.StaffAD || ''); // 收银员
    setElementText("#companyName", Checkout.Company || Checkout.CompanyName || ''); // 公司名称
    setElementText("#groupName", Checkout.GroupName || ''); // 团体名称
    setElementText("#memberNumber", Checkout.MemberNum || ''); // 会员号码
    
    // 从消费记录中获取最早的日期作为到店时间
    let earliestDate = '';
    if (Checkout.DetailList && Checkout.DetailList.length > 0) {
      const sortedDates = [...Checkout.DetailList]
        .filter(item => item.Date)
        .sort((a, b) => new Date(a.Date) - new Date(b.Date));
      if (sortedDates.length > 0) {
        earliestDate = sortedDates[0].Date;
      }
    }
    setElementText("#checkinTime", earliestDate || Checkout.CheckinTime || ''); // 到店时间
    setElementText("#checkoutTime", Checkout.CheckoutTime || ''); // 离店时间

    // 填充总计金额 - 修正选择器以匹配HTML结构
    setElementText(".Print-details table > tbody > tr.Consumptionfooter > td:nth-child(3)", `消费合计：${Checkout.ConsumptionTotal || '0.00'}`);
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
      dateTd.setAttribute('align', 'left');
      tr.appendChild(dateTd);
      
      // 创建摘要单元格
      const descTd = document.createElement('td');
      descTd.textContent = `${consumption.ConsumptionType || ''}${consumption.ConsumptionRoom || ''}`;
      tr.appendChild(descTd);
      
      // 创建消费金额单元格
      const amountTd = document.createElement('td');
      amountTd.textContent = consumption.ConsumptionAmount || '0.00';
      tr.appendChild(amountTd);
      
      // 创建空的付款单元格（与HTML结构匹配）
      const emptyTd = document.createElement('td');
      tr.appendChild(emptyTd);
      
      // 添加到表格（插入到footer行之前）
      consumptionFooter.parentNode.insertBefore(tr, consumptionFooter);
    });
  }
}

/**
 * 填充付款表格
 */
function fillPaymentTable() {
  const paymentHead = document.querySelector('.Paymenthead');
  const consumptionFooter = document.querySelector('.Consumptionfooter');
  
  // 检查是否有付款数据和元素是否存在
  if (paymentHead && Checkout.CheckoutData && Checkout.CheckoutData[0] && 
      Checkout.CheckoutData[0].Payment && Checkout.CheckoutData[0].Payment.length > 0) {
      
    // 显示付款合计行
    paymentHead.style.display = '';
    
    // 更新付款合计金额，付款合计：
    setElementText(".Paymenthead td:nth-child(3)", `付款合计：${Checkout.PaymentTotal || '0.00'}`);
    
    // 遍历付款数据并添加到表格
    Checkout.CheckoutData[0].Payment.forEach(payment => {
      const tr = document.createElement('tr');
      
      // 创建日期单元格
      const dateTd = document.createElement('td');
      dateTd.textContent = payment.PaymentDate || '';
      dateTd.setAttribute('align', 'left');
      tr.appendChild(dateTd);
      
      // 创建付款方式单元格
      const typeTd = document.createElement('td');
      typeTd.textContent = payment.PaymentType || '';
      tr.appendChild(typeTd);
      
      // 创建空的消费金额单元格
      const emptyTd = document.createElement('td');
      tr.appendChild(emptyTd);
      
      // 创建付款金额单元格
      const amountTd = document.createElement('td');
      amountTd.textContent = payment.PaymentAmount || '0.00';
      tr.appendChild(amountTd);
      
      // 添加到表格（插入到付款合计行之前）
      paymentHead.parentNode.insertBefore(tr, paymentHead);
    });
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
    setElementText("body > div > div.Print-header > div.title", hotelInfo.HotelName || '');
    setElementText("body > div > div.Print-footer > div:nth-child(1) > span", `地址:${hotelInfo.HotelAddress || ''}`);
    setElementText("body > div > div.Print-footer > div:nth-child(2) > span", `电话:${hotelInfo.HotelPhone || ''}`);
    setElementText("body > div > div.Print-footer > div:nth-child(3) > span", `邮编:${hotelInfo.HotelZip || ''}`);
    setElementText("body > div > div.Print-footer > div:nth-child(4) > span", `传真:${hotelInfo.HotelFax || ''}`);
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