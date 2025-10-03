// 导入公共函数
import { getSettings, showModal, initModal, options, initDatePicker, addDay, nowDate } from '../main.js';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

// 全局变量
let HandoverSheet = {
  Sheet: [
    {
      HotelName: '',
      date: '',
      staffName: '',
      PMSUM: '',
      POSUM: '',
      Difference: '',
      DifferenceDESC: ''
    }
  ]
};

// 初始化函数
function init() {
  // 设置默认日期为当天日期-1天
  const yesterday = addDay(nowDate(), -1);
  document.getElementById('todayDate').value = yesterday;
  
  // 初始化日期选择器
  try {
    initDatePicker('todayDate', {
      format: 'yyyy-MM-dd',
      value: yesterday  // 显式传递已设置的前一天日期，避免被覆盖
    });
  } catch (error) {
    console.error('初始化日期选择器失败:', error);
  }
  
  // 初始化模态框
  initModal();
  
  // 加载设置数据
  loadSettings();
  
  // 添加事件监听器
  setupEventListeners();
}

// 加载设置数据
async function loadSettings() {
  try {
    const settings = await getSettings();
    // 添加适当的检查，防止访问undefined的属性
    HandoverSheet.Sheet[0].HotelName = settings.Hotel && settings.Hotel[0] ? settings.Hotel[0].HotelName : '橙子上海徐家汇虚拟酒店';
    HandoverSheet.Sheet[0].staffName = settings.Staff && settings.Staff[0] ? settings.Staff[0].StaffName : 'TEST001';
    HandoverSheet.Sheet[0].date = document.getElementById('todayDate').value;
  } catch (error) {
      console.error('加载设置失败:', error);
      showModal('错误', '加载设置失败，请稍后重试。');
    }
}

// 设置事件监听器
function setupEventListeners() {
  // 预览按钮
  document.getElementById('HandoverSheetSubmit').addEventListener('click', previewHandoverSheet);
  
  // 清空按钮
  document.getElementById('ClearHandoverSheetFrom').addEventListener('click', clearHandoverSheet);
  
  // PMS和POS金额输入事件，自动计算差异
  const pmsInput = document.getElementById('PMSUM');
  const posInput = document.getElementById('POSUM');
  const differenceInput = document.getElementById('Difference');
  
  function calculateDifference() {
    const pmsAmount = parseFloat(pmsInput.value) || 0;
    const posAmount = parseFloat(posInput.value) || 0;
    const difference = (pmsAmount - posAmount).toFixed(2);
    differenceInput.value = difference;
    
    // 更新全局数据
    HandoverSheet.Sheet[0].PMSUM = pmsAmount.toFixed(2);
    HandoverSheet.Sheet[0].POSUM = posAmount.toFixed(2);
    HandoverSheet.Sheet[0].Difference = difference;
  }
  
  pmsInput.addEventListener('input', calculateDifference);
  posInput.addEventListener('input', calculateDifference);
  
  // 差异说明输入事件
  document.getElementById('DifferenceDESC').addEventListener('input', function() {
    HandoverSheet.Sheet[0].DifferenceDESC = this.value;
  });
  
  // 日期输入事件
  document.getElementById('todayDate').addEventListener('change', function() {
    HandoverSheet.Sheet[0].date = this.value;
  });
  
  // 模态框关闭按钮
  document.querySelectorAll('.Print-close').forEach(button => {
    button.addEventListener('click', function() {
      document.getElementById('PreviewModal').classList.add('hidden');
    });
  });
  
  // 打印按钮
  document.getElementById('PrintThis').addEventListener('click', printHandoverSheet);
}

// 预览交接单
function previewHandoverSheet() {
  // 检查必填项
  const pmsAmount = document.getElementById('PMSUM').value;
  const posAmount = document.getElementById('POSUM').value;
  
  if (!pmsAmount || !posAmount) {
    showModal('提示', '请填写PMS和POS机刷卡金额！');
    return;
  }
  
  // 保存当前数据到Chrome存储
  saveHandoverSheet();
  
  // 创建预览内容
  const previewContent = `
    <iframe 
      src="handoverPrint/handoverPrint.html" 
      width="100%" 
      height="100%" 
      frameborder="0"
      id="previewFrame"
    ></iframe>
  `;
  
  // 显示预览模态框
  document.getElementById('previewCheckout').innerHTML = previewContent;
  document.getElementById('PreviewModal').classList.remove('hidden');
}

// 保存交接单数据
function saveHandoverSheet() {
  try {
    chrome.storage.local.set({ HandoverSheet });
  } catch (error) {
    console.error('保存交接单数据失败:', error);
  }
}

// 打印交接单
function printHandoverSheet() {
  const previewFrame = document.getElementById('previewFrame');
  if (previewFrame) {
    previewFrame.contentWindow.print();
  }
}

// 清空交接单
function clearHandoverSheet() {
  document.getElementById('PMSUM').value = '';
  document.getElementById('POSUM').value = '';
  document.getElementById('Difference').value = '';
  document.getElementById('DifferenceDESC').value = '';
  
  // 重置全局数据
  HandoverSheet.Sheet[0].PMSUM = '';
  HandoverSheet.Sheet[0].POSUM = '';
  HandoverSheet.Sheet[0].Difference = '';
  HandoverSheet.Sheet[0].DifferenceDESC = '';
}

/**
 * 初始化引导功能
 */
function initDriverGuide() {
  // 添加全局函数，允许用户通过控制台或按钮显示引导
  window.showHandoverSheetGuide = () => {
    // 创建driver实例并显示引导
    const newDriver = driver({
      showProgress: true,
      nextBtnText: '下一步',
      prevBtnText: '上一步',
      doneBtnText: '完成',
      steps: [
        {
          element: '#todayDate',
          popover: {
            title: '当天日期',
            description: '显示交接日期，默认为前一天日期',
            position: 'bottom-right'
          }
        },
        {
          element: '#PMSUM',
          popover: {
            title: '全天PMS刷卡金额',
            description: '请输入酒店PMS系统中记录的全天刷卡总金额',
            position: 'bottom-right'
          }
        },
        {
          element: '#POSUM',
          popover: {
            title: '全天POS机刷卡金额',
            description: '请输入实际从POS机中导出的全天刷卡总金额',
            position: 'bottom-right'
          }
        },
        {
          element: '#Difference',
          popover: {
            title: '差异',
            description: '系统会自动计算PMS与POS金额的差异',
            position: 'bottom-right'
          }
        },
        {
          element: '#DifferenceDESC',
          popover: {
            title: '差异说明',
            description: '如果存在差异，请详细说明差异原因',
            position: 'bottom'
          }
        },
        {
          element: '#HandoverSheetSubmit',
          popover: {
            title: '预览按钮',
            description: '填写完成后，点击此按钮预览交接单',
            position: 'left'
          }
        },
        {
          element: '#ClearHandoverSheetFrom',
          popover: {
            title: '清空按钮',
            description: '点击此按钮可以清空所有填写内容',
            position: 'left'
          }
        }
      ],
      onDestroy: () => {
        // 引导结束后，记录引导已显示
        chrome.storage.local.set({ 'handoverSheetGuideShown': true });
      }
    });
    newDriver.drive();
  };
  
  // 为问号按钮添加点击事件，显示引导
  document.getElementById('guideButton').addEventListener('click', function() {
    showHandoverSheetGuide();
  });
  
  // 已关闭自动触发引导功能，仅保留手动触发
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  init();
  initDriverGuide();
});

export { HandoverSheet };