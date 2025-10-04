import { getSettings, saveSettings, getDefaultSettings, showModal, showTopAlert } from '../main.js';

// 导入OpenAI库
import OpenAI from 'openai';

// 导入引导库
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

// 全局变量
let isLoading = false;
let currentSystemPrompt = '';
let openai = null;
let isStreaming = true; // 默认使用流式响应

// 初始化函数
async function init() {
  // 加载设置
  await loadSettings();
  
  // 初始化OpenAI客户端
  initOpenAIClient();
  
  // 初始化系统提示词选择器
  initSystemPromptSelector();
  
  // 添加事件监听器
  addEventListeners();
}

// 加载设置
async function loadSettings() {
  try {
    const settings = await getSettings();
    window.options = settings || getDefaultSettings();
    
    // 检查设置信息是否配置完整
    if (!window.options || !window.options.AI) {
      window.options = getDefaultSettings();
      showModal('提示', 'AI设置信息配置不完整，可能无法使用AI功能！<a href="/src/options/options.html#AI" class="text-blue-600 hover:text-blue-800">去设置</a>');
    }
  } catch (error) {
    console.error('加载设置失败:', error);
    window.options = getDefaultSettings();
    showModal('错误', '加载设置失败，请确保插件已正确安装并配置！');
  }
}

// 初始化系统提示词选择器
function initSystemPromptSelector() {
  const selector = document.getElementById('system-prompt-select');
  if (!selector || !window.options || !window.options.AI || !window.options.AI.systemPrompts) {
    return;
  }
  
  // 清空选择器
  selector.innerHTML = '';
  
  // 添加系统提示词选项
  window.options.AI.systemPrompts.forEach((prompt, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = prompt.title;
    selector.appendChild(option);
  });
  
  // 添加选择事件监听
  selector.addEventListener('change', function() {
    const selectedIndex = parseInt(this.value);
    if (selectedIndex >= 0 && window.options.AI.systemPrompts[selectedIndex]) {
      currentSystemPrompt = window.options.AI.systemPrompts[selectedIndex].content;
    } else {
      currentSystemPrompt = '';
    }
  });
  
  // 默认选择第一个系统提示词
  if (window.options.AI.systemPrompts.length > 0) {
    selector.value = '0';
    // 触发change事件以更新currentSystemPrompt变量
    selector.dispatchEvent(new Event('change'));
  }
}



// 添加事件监听器
function addEventListeners() {
  // 发送按钮点击事件
  document.getElementById('send-button').addEventListener('click', sendMessage);
  
  // 输入框回车发送
  document.getElementById('message-input').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
  

}

// 发送消息
async function sendMessage() {
  const inputElement = document.getElementById('message-input');
  const message = inputElement.value.trim();
  
  if (isLoading) {
    return;
  }
  
  // 检查文本框是否为空
  if (!message) {
    showModal('提示', '请输入您的问题后再发送');
    return;
  }
  
  // 清空输入框
  inputElement.value = '';
  
  // 显示用户消息
  addMessageToChat('user', message);
  
  // 设置为加载状态
  isLoading = true;
  const sendButton = document.getElementById('send-button');
  const originalButtonText = sendButton.innerHTML;
  sendButton.disabled = true;
  sendButton.innerHTML = '<i class="ri-loader-5-line text-base animate-spin inline mr-1"></i>发送中...'
  
  try {
    // 获取AI回复
    await getAIResponse(message);
  } catch (error) {
    console.error('发送消息失败:', error);
    addMessageToChat('bot', '抱歉，处理您的请求时出现错误。请稍后再试。');
  } finally {
    // 恢复按钮状态
    isLoading = false;
    sendButton.disabled = false;
    sendButton.innerHTML = originalButtonText;
  }
}

// 初始化OpenAI客户端
function initOpenAIClient() {
  if (!window.options || !window.options.AI) {
    console.error('AI设置未找到');
    return;
  }
  
  const aiSettings = window.options.AI;
  
  openai = new OpenAI({
    apiKey: aiSettings.APIKey, 
    baseURL: aiSettings.APIBaseURL || 'https://ark.cn-beijing.volces.com/api/v3',
    dangerouslyAllowBrowser: true // 允许在浏览器环境中运行，注意安全风险
  });
}

// 调用AI API获取回复
async function callAIAPI(userMessage) {
  if (!openai) {
    initOpenAIClient();
    if (!openai) {
      showModal('错误', 'OpenAI客户端初始化失败，请检查设置');
      return '抱歉，AI服务暂时不可用，请稍后再试。';
    }
  }
  
  if (!window.options || !window.options.AI) {
    return '抱歉，AI设置不完整，请检查设置。';
  }
  
  const aiSettings = window.options.AI;
  
  try {
    // 构建消息列表，包括系统提示词和用户消息
    const messages = [];
    
    // 添加系统提示词
    if (currentSystemPrompt) {
      messages.push({ role: 'system', content: currentSystemPrompt });
    }
    
    // 添加用户消息
    messages.push({ role: 'user', content: userMessage });
    
    // 根据设置决定使用流式还是非流式调用
    if (isStreaming) {
      // 流式调用
      return await callAIAPIStream(messages, aiSettings);
    } else {
      // 非流式调用
      return await callAIAPIStandard(messages, aiSettings);
    }
  } catch (error) {
    console.error('调用AI API失败:', error);
    //模态框提示错误信息
    showModal('错误', `调用AI服务失败: ${error.message}`);
    
    
    // 提供友好的错误信息
    
    if (error.message.includes('AuthenticationError')) {
      return 'API密钥无效或缺失，请检查您的设置。';
    } else if (error.message.includes('timeout')) {
      return '请求超时，请稍后再试。';
    } else if (error.message.includes('Not Found')) {
      return '请求的模型或端点不存在，请检查设置。';
    }
    
    return `调用AI服务失败: ${error.message}`;
  }
}

// 非流式调用AI API
async function callAIAPIStandard(messages, aiSettings) {
  const completion = await openai.chat.completions.create({
    messages: messages,
    model: aiSettings.AIModelType || 'doubao-1-5-pro-32k-250115',
    max_tokens: Math.min(aiSettings.MaxTokens || 16384, 16384), // 限制最大值为16384
    temperature: aiSettings.Temperature || 0.7,
    top_p: aiSettings.TopP || 1,
    frequency_penalty: aiSettings.FrequencyPenalty || 0,
    presence_penalty: aiSettings.PresencePenalty || 0
  });
  
  return completion.choices[0]?.message?.content || '未获取到回复内容。';
}

// 流式调用AI API
async function callAIAPIStream(messages, aiSettings) {
  const stream = await openai.chat.completions.create({
    messages: messages,
    model: aiSettings.AIModelType || 'doubao-1-5-pro-32k-250115',
    max_tokens: Math.min(aiSettings.MaxTokens || 16384, 16384), // 限制最大值为16384
    temperature: aiSettings.Temperature || 0.7,
    top_p: aiSettings.TopP || 1,
    frequency_penalty: aiSettings.FrequencyPenalty || 0,
    presence_penalty: aiSettings.PresencePenalty || 0,
    stream: true
  });
  
  // 创建流式回复的消息元素
  const chatContainer = document.getElementById('chat-container');
  const messageElement = document.createElement('div');
  messageElement.className = 'message-bot mb-4';
  
  // 生成唯一消息ID
  const messageId = 'message-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  
  const avatarHtml = `
    <div class="bg-blue-100 p-2 rounded-full">
      <i class="ri-chat-ai-line text-lg text-blue-600"></i>
    </div>`;
  
  // 初始化消息内容为空
  let fullContent = '';
  
  // 设置消息元素HTML（包含空内容和复制按钮）
  messageElement.innerHTML = `
    <div class="flex items-start">
      ${avatarHtml}
      <div class="ml-2 bg-gray-100 rounded-lg p-3 max-w-[80%] relative">
        <p data-message-id="${messageId}" class="streaming-content"></p>
        <button class="copy-button absolute top-2 right-2 text-xs opacity-0 hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-gray-200">
          <i class="ri-file-copy-line text-sm"></i>
        </button>
      </div>
    </div>
  `;
  
  // 添加到聊天容器
  chatContainer.appendChild(messageElement);
  const contentElement = messageElement.querySelector(`[data-message-id="${messageId}"]`);
  
  // 滚动到底部
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  // 处理流式响应
  for await (const part of stream) {
    const deltaContent = part.choices[0]?.delta?.content || '';
    if (deltaContent) {
      fullContent += deltaContent;
      
      // 使用marked解析Markdown格式
      const htmlContent = window.marked(fullContent);
      contentElement.innerHTML = htmlContent;
      
      // 滚动到底部
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }
  
  // 流式响应结束后，添加复制功能
  const copyButton = messageElement.querySelector('.copy-button');
  if (copyButton) {
    copyButton.addEventListener('mouseenter', function() {
      this.classList.remove('opacity-0');
    });
    
    copyButton.addEventListener('click', function() {
      copyToClipboard(fullContent);
      this.innerHTML = `
        <i class="ri-check-line text-sm text-green-600"></i>
      `;
      
      setTimeout(() => {
        this.innerHTML = `
          <i class="ri-file-copy-line text-sm"></i>
        `;
      }, 2000);
    });
  }
  
  
  return fullContent;
}

// 获取AI回复
async function getAIResponse(userMessage) {
  // 调用真实的AI API获取回复
  const aiResponse = await callAIAPI(userMessage);
  
  // 如果不是流式响应，手动添加到聊天界面
  if (!isStreaming) {
    addMessageToChat('bot', aiResponse);
  }
}

// 添加消息到聊天界面
function addMessageToChat(sender, content) {
  const chatContainer = document.getElementById('chat-container');
  
  // 创建消息元素
  const messageElement = document.createElement('div');
  messageElement.className = `message-${sender} mb-4`;
  
  let avatarHtml = '';
  let messageClass = '';
  
  if (sender === 'user') {
    avatarHtml = `
      <div class="bg-gray-200 p-2 rounded-full">
        <i class="ri-user-line text-lg text-gray-600"></i>
      </div>`;
    messageClass = 'bg-blue-500 text-white';
  } else {
    avatarHtml = `
      <div class="bg-blue-100 p-2 rounded-full">
        <i class="ri-chat-ai-line text-lg text-blue-600"></i>
      </div>`;
    messageClass = 'bg-gray-100';
  }
  
  // 如果是AI回复，使用marked解析Markdown格式
  let finalContent = content;
  if (sender === 'bot' && window.marked) {
    finalContent = window.marked(content);
  } else {
    // 普通消息，只处理换行
    finalContent = content.replace(/\n/g, '<br>');
  }
  
  // 设置消息元素HTML
  messageElement.innerHTML = `
    <div class="flex items-start ${sender === 'user' ? 'justify-end' : ''}">
      ${sender === 'user' ? '' : avatarHtml}
      <div class="ml-2 mr-2 ${messageClass} rounded-lg p-3 max-w-[80%] relative">
        ${sender === 'bot' ? finalContent : `<p>${finalContent}</p>`}
        ${sender === 'bot' ? `
        <button class="copy-button absolute top-2 right-2 text-xs opacity-0 hover:opacity-100 transition-opacity duration-200 p-1 rounded-md hover:bg-gray-200">
          <i class="ri-file-copy-line text-sm"></i>
        </button>` : ''}
      </div>
      ${sender === 'user' ? avatarHtml : ''}
    </div>
  `;
  
  // 添加到聊天容器
  chatContainer.appendChild(messageElement);
  
  // 滚动到底部
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  // 如果是AI消息，添加复制功能
  if (sender === 'bot') {
    const copyButton = messageElement.querySelector('.copy-button');
    copyButton.addEventListener('mouseenter', function() {
      this.classList.remove('opacity-0');
    });
    
    messageElement.querySelector('.copy-button').addEventListener('click', function() {
      copyToClipboard(content);
      this.innerHTML = `
        <i class="ri-check-line text-sm text-green-600"></i>
      `;
      
      setTimeout(() => {
        this.innerHTML = `
          <i class="ri-file-copy-line text-sm"></i>
        `;
      }, 2000);
    });
  }

}

// 复制到剪贴板
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showTopAlert('内容已复制到剪贴板', 'success');
  }).catch(err => {
    console.error('复制失败:', err);
    showTopAlert('复制失败，请手动复制', 'error');
  });
}



// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  init();
  
  // 添加全局函数，允许用户通过控制台或按钮显示引导
  window.showAiAssistantGuide = () => {
    // 清除已显示过的标记，重新显示引导
    localStorage.removeItem('aiassistant-guide-shown');
    initDriverGuide();
  };
  
  // 为问号按钮添加点击事件，显示引导
  document.getElementById('guideButton').addEventListener('click', function() {
    showAiAssistantGuide();
  });
});

/**
 * 初始化引导功能
 */
function initDriverGuide() {
  // 清除已显示过的标记，每次点击按钮都显示引导
  localStorage.removeItem('aiassistant-guide-shown');

  // 创建driver实例
  const newDriver = driver({
    showProgress: true,
    nextBtnText: '下一步',
    prevBtnText: '上一步',
    doneBtnText: '完成',
    steps: [
      {
        element: '#system-prompt-select',
        popover: {
          title: '系统提示词选择器',
          description: '选择适合您需求的系统提示词，这将影响AI的回答风格',
          position: 'top'
        }
      },
      {
        element: '#message-input',
        popover: {
          title: '消息输入框',
          description: '在这里输入您的问题或指令',
          position: 'top'
        }
      },
      {
        element: '#send-button',
        popover: {
          title: '发送按钮',
          description: '点击发送您的问题给AI',
          position: 'left'
        }
      },
      {
        element: '#chat-container',
        popover: {
          title: '聊天内容区域',
          description: 'AI的回答将显示在这里',
          position: 'bottom'
        }
      }
    ],
    onDestroy: () => {
      // 引导结束后，记录引导已显示
      localStorage.setItem('aiassistant-guide-shown', 'true');
    }
  });

  // 启动引导
  newDriver.drive();
}