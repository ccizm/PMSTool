// 页面加载完成后填充数据
document.addEventListener('DOMContentLoaded', function() {
  // 从Chrome存储中获取交接单数据
  chrome.storage.local.get(['HandoverSheet', 'options'], function(result) {
    const handoverSheet = result.HandoverSheet;
    const settings = result.options;
    
    // 如果有交接单数据
    if (handoverSheet && handoverSheet.Sheet && handoverSheet.Sheet.length > 0) {
      const sheetData = handoverSheet.Sheet[0];
      
      // 填充酒店名称
      if (sheetData.HotelName) {
        document.getElementById('hotelName').textContent = sheetData.HotelName;
      } else if (settings && settings.Hotel && settings.Hotel.length > 0) {
        document.getElementById('hotelName').textContent = settings.Hotel[0].HotelName || '橙子上海徐家汇虚拟酒店';
      } else {
        document.getElementById('hotelName').textContent = '橙子上海徐家汇虚拟酒店';
      }
      
      // 填充营业日
      document.getElementById('date').textContent = sheetData.date || new Date().toLocaleDateString('zh-CN');
      
      // 填充登记人
      if (sheetData.staffName) {
        document.getElementById('staffName').textContent = sheetData.staffName;
      } else if (settings && settings.Staff && settings.Staff.length > 0) {
        document.getElementById('staffName').textContent = settings.Staff[0].StaffName || 'TEST001';
      } else {
        document.getElementById('staffName').textContent = 'TEST001';
      }
      
      // 填充PMS刷卡金额
      document.getElementById('pmsAmount').textContent = sheetData.PMSUM || '0.00';
      
      // 填充POS机刷卡金额
      document.getElementById('posAmount').textContent = sheetData.POSUM || '0.00';
      
      // 填充差异
      document.getElementById('difference').textContent = sheetData.Difference || '0.00';
      
      // 填充差异说明
      document.getElementById('differenceDesc').textContent = sheetData.DifferenceDESC || '';
    } else {
      // 如果没有交接单数据，使用默认值或从设置中获取
      if (settings && settings.Hotel && settings.Hotel.length > 0) {
        document.getElementById('hotelName').textContent = settings.Hotel[0].HotelName || '橙子上海徐家汇虚拟酒店';
      } else {
        document.getElementById('hotelName').textContent = '橙子上海徐家汇虚拟酒店';
      }
      
      document.getElementById('date').textContent = new Date().toLocaleDateString('zh-CN');
      
      if (settings && settings.Staff && settings.Staff.length > 0) {
        document.getElementById('staffName').textContent = settings.Staff[0].StaffName || 'TEST001';
      } else {
        document.getElementById('staffName').textContent = 'TEST001';
      }
    }
  });
});