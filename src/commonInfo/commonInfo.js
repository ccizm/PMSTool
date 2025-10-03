// 导入main.js中的getSettings函数
import { getSettings, showModal, initModal } from '../main.js';
import { marked } from 'marked';

// 初始化常用信息页面
function initCommonInfo() {
    // 从index.json加载系统信息列表并动态生成菜单项
    loadSystemInfoList();

    // 加载自定义常用信息
    loadCustomCommonInfo();
}

// 从index.json加载系统信息列表
function loadSystemInfoList() {
    const menuElement = document.querySelector('#commenu ul');
    
    // 创建加载中状态
    menuElement.innerHTML = '<li class="text-center text-gray-500 py-4">加载中...</li>';
    
    // 从index.json加载数据    
    fetch('/src/commonInfo/data/index.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('系统信息索引文件加载失败');
            }
            return response.json();
        })
        .then(data => {
            const systemInfoList = data.index || [];
            
            // 清空列表
            menuElement.innerHTML = '';
            
            // 如果没有系统信息，显示提示
            if (systemInfoList.length === 0) {
                menuElement.innerHTML = '<li class="text-center text-gray-500 py-4">暂无系统信息</li>';
                return;
            }
            
            // 创建系统信息菜单项
            systemInfoList.forEach((info, index) => {
                // 检查info对象和url属性是否存在
                if (!info || !info.url) {
                    console.warn('Invalid system info object at index', index, info);
                    return;
                }
                
                // 提取jsonData（从url中去掉路径和扩展名）
                const pathParts = info.url.split('/');
                const fileName = pathParts[pathParts.length - 1];
                const jsonData = fileName.split('.')[0];
                
                // 创建菜单项
                const li = document.createElement('li');
                
                // 获取图标类型
                const iconType = getIconType(jsonData);
                
                li.innerHTML = `
                    <a href="#" json-data="${jsonData}" class="block px-3 py-2 rounded-md bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center">
                        <i class="${iconType} text-base mr-2 text-gray-400"></i>
                        ${info.title}
                    </a>
                `;
                
                menuElement.appendChild(li);
            });
            
            // 为菜单项添加点击事件
            const menuItems = document.querySelectorAll('#commenu a');
            menuItems.forEach(item => {
                item.addEventListener('click', function (e) {
                    e.preventDefault();
                    const jsonData = this.getAttribute('json-data');
                    const title = this.textContent.trim();
                    displaySystemInfo(jsonData, title);
                });
            });
            
            // 默认点击第一个菜单项
            if (menuItems.length > 0) {
                menuItems[0].click();
            }
        })
        .catch(error => {
            console.error('加载系统信息列表失败:', error);
            menuElement.innerHTML = `<li class="text-center text-red-500 py-4">加载失败：${error.message}</li>`;
        });
}

// 根据jsonData获取对应的remixicon图标
function getIconType(jsonData) {
    // 可以根据不同的jsonData返回不同的图标名称
    const iconMap = {
        'Country-code': 'ri-flag-line',
        'Monthabbr': 'ri-calendar-line',
        'Visa-free': 'ri-passport-line'
    };
    
    // 返回对应的图标名称，如果没有则返回默认图标
    return iconMap[jsonData] || 'ri-file-text-line';
}

// 加载自定义常用信息（从options设置中获取）
function loadCustomCommonInfo() {
    // 使用getSettings函数从Chrome存储获取设置
    getSettings().then(settings => {
        const customInfoList = settings.CommonInfo || [];
        const listElement = document.getElementById('customInfoList');
        
        // 清空列表
        listElement.innerHTML = '';
        
        // 如果没有自定义信息，显示提示
        if (customInfoList.length === 0) {
            listElement.innerHTML = '<li class="text-center text-gray-500 py-4">暂无自定义常用信息，去<a href="/src/options/options.html"  class="text-blue-500 hover:underline">添加</a></li>';
            return;
        }
        
        // 创建自定义信息菜单项
        customInfoList.forEach(info => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="flex items-center justify-between">
                    <a href="#" custom-id="${info.id}" title="${info.name}"
                        class="block px-4 py-2 rounded-md bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors w-full truncate">${info.name}</a>
                </div>
            `;
            
            listElement.appendChild(li);
        });
        
        // 为自定义信息菜单项添加点击事件
        const customItems = document.querySelectorAll('#customInfoList a[custom-id]');
        customItems.forEach(item => {
            item.addEventListener('click', function (e) {
                e.preventDefault();
                const customId = this.getAttribute('custom-id');
                
                // 查找对应的自定义信息
                const info = customInfoList.find(item => item.id === customId);
                if (info) {
                    displayCustomInfo(info);
                }
            });
        });
    }).catch(error => {
        console.error('加载自定义常用信息失败:', error);
        
        // 显示错误提示
        const listElement = document.getElementById('customInfoList');
        listElement.innerHTML = '<li class="text-center text-red-500 py-4">加载常用信息失败</li>';
    });
}

// 显示系统信息
function displaySystemInfo(jsonData, title) {
    // 设置标题
    const titleElement = document.getElementById('TableInfoTitle');
    titleElement.textContent = title;
    titleElement.removeAttribute('data-custom-id');
    
    // 获取内容容器
    const contentElement = document.getElementById('InfoContent');
    
    // 清空内容容器
    contentElement.innerHTML = '';
    
    // 创建加载中状态
    const loadingElement = document.createElement('div');
    loadingElement.className = 'text-center text-gray-500 py-12';
    loadingElement.textContent = '加载中...';
    contentElement.appendChild(loadingElement);
    
    // 异步加载数据
    setTimeout(() => {
        try {
            // 创建表格显示数据
            createTable(jsonData);
        } catch (error) {
            // 显示错误信息
            contentElement.innerHTML = `<div class="text-center text-red-500 py-12">加载失败：${error.message}</div>`;
        }
    }, 100);
}

// 显示自定义信息
function displayCustomInfo(info) {
    // 设置标题
    const titleElement = document.getElementById('TableInfoTitle');
    titleElement.textContent = info.name;
    titleElement.setAttribute('data-custom-id', info.id);
    
    // 获取内容容器
    const contentElement = document.getElementById('InfoContent');
    
    // 清空内容容器
    contentElement.innerHTML = '';
    
    // 创建内容区域
    const contentDiv = document.createElement('div');
    contentDiv.className = 'markdown-content prose max-w-none';
    
    try {
        // 检查内容是否包含HTML标签
        if (isHTML(info.content)) {
            contentDiv.innerHTML = info.content;
        } else {
            // 尝试使用marked解析markdown格式的内容
            const htmlContent = marked.parse(info.content);
            contentDiv.innerHTML = htmlContent;
        }
    } catch (error) {
        console.error('解析内容失败:', error);
        const textDiv = document.createElement('div');
        textDiv.textContent = info.content;
        contentDiv.appendChild(textDiv);
    }
    
    contentElement.appendChild(contentDiv);
}

// 判断字符串是否为HTML
function isHTML(str) {
    const doc = new DOMParser().parseFromString(str, 'text/html');
    return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
}

// 重置表格显示默认提示
function resetTable() {
    // 获取内容容器
    const contentElement = document.getElementById('InfoContent');
    
    // 清空内容容器
    contentElement.innerHTML = '';
    
    // 创建默认提示元素
    const defaultElement = document.createElement('p');
    defaultElement.className = 'text-center text-gray-500 py-12';
    defaultElement.textContent = '请选择您要查询的信息...';
    
    // 添加默认提示到容器
    contentElement.appendChild(defaultElement);
    
    // 重置标题
    const titleElement = document.getElementById('TableInfoTitle');
    titleElement.textContent = '查常用信息';
    titleElement.removeAttribute('data-custom-id');
}

// 创建表格
function createTable(jsonData) {
    const contentContainer = document.getElementById('InfoContent');
    
    // 清空容器内容
    contentContainer.innerHTML = '';
    
    // 创建表格元素
    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200';
    
    // 创建表头和表体
    const thead = document.createElement('thead');
    thead.className = 'bg-gray-50';
    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';
    
    table.appendChild(thead);
    table.appendChild(tbody);
    contentContainer.appendChild(table);
    
    // 从JSON文件加载数据
    fetch(`/src/commonInfo/data/commonInfo/${jsonData}.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('数据加载失败');
            }
            return response.json();
        })
        .then(data => {
            // 创建表头
            const headerRow = document.createElement('tr');
            Object.keys(data[0]).forEach(key => {
                const th = document.createElement('th');
                th.className = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
                th.textContent = key;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            
            // 创建表格内容
            data.forEach(rowData => {
                const tr = document.createElement('tr');
                Object.values(rowData).forEach(value => {
                    const td = document.createElement('td');
                    td.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
                    td.textContent = value;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
        })
        .catch(error => {
            console.error('创建表格失败:', error);
            showModal('提示', '获取数据失败，请稍后再试。');
            
            // 清空之前创建的表格内容
            thead.innerHTML = '';
            tbody.innerHTML = '';
            
            // 显示错误信息
            const errorRow = document.createElement('tr');
            const errorCell = document.createElement('td');
            errorCell.className = 'px-6 py-12 text-center text-red-500';
            errorCell.colSpan = '100%';
            errorCell.textContent = '数据加载失败，请稍后重试';
            errorRow.appendChild(errorCell);
            tbody.appendChild(errorRow);
        });
}

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', function() {
    initCommonInfo();
    initModal(); // 初始化模态框
});

export { initCommonInfo, createTable };