// API Configuration
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const welcomeTitle = document.getElementById('welcomeTitle');
const welcomeWrapper = document.getElementById('welcomeWrapper');
const chatContainer = document.querySelector('.chat-container');
const mainContent = document.querySelector('.main-content');
const inputContainer = document.querySelector('.input-container');

// Sidebar Elements
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const sidebarClose = document.getElementById('sidebarClose');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const header = document.querySelector('.header');
const mainElement = document.querySelector('main');
const headerLogo = document.querySelector('.header .logo');

// Sidebar Functions
function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    header.classList.add('sidebar-open');
    mainElement.classList.add('sidebar-open');
    menuBtn.classList.add('hidden');
    headerLogo.classList.add('hidden');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    header.classList.remove('sidebar-open');
    mainElement.classList.remove('sidebar-open');
    menuBtn.classList.remove('hidden');
    headerLogo.classList.remove('hidden');
}

// Sidebar Event Listeners
menuBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// Session ID for conversation history
const sessionId = 'session_' + Date.now();

// Send message function
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Disable input while processing
    userInput.disabled = true;
    sendBtn.disabled = true;
    
    // Add user message to chat
    addMessage(message, 'user');
    userInput.value = '';
    
    // Show typing indicator
    const typingIndicator = showTypingIndicator();
    
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, sessionId }),
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        typingIndicator.remove();
        
        if (response.ok) {
            addMessage(data.response, 'assistant');
        } else {
            addMessage('Desculpe, ocorreu um erro ao processar sua mensagem.', 'assistant');
        }
    } catch (error) {
        console.error('Error:', error);
        typingIndicator.remove();
        addMessage('Erro de conexão. Verifique se o servidor está rodando.', 'assistant');
    }
    
    // Re-enable input
    userInput.disabled = false;
    sendBtn.disabled = false;
    userInput.focus();
}

// Hide welcome and activate chat mode
function activateChatMode() {
    if (welcomeWrapper && !welcomeWrapper.classList.contains('hidden')) {
        welcomeWrapper.classList.add('hidden');
        chatContainer.classList.add('chat-active');
        mainContent.classList.add('chat-active');
        inputContainer.classList.add('fixed');
    }
}

// Ensure messages area has enough bottom padding so last message is not hidden
function updateMessagesPadding() {
    // No longer needed - using fixed padding-bottom on main-content
}

// Scroll to latest message - scroll window/body so last message is visible above input
function scrollToBottom() {
    const last = chatMessages.lastElementChild;
    if (last) {
        setTimeout(() => {
            try {
                // Scroll window so the last message is in view, positioned at top of visible area
                last.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) {
                // fallback: scroll to bottom of page
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
        }, 50);
    }
}

// Add message to chat
function addMessage(text, sender) {
    // Activate chat mode on first message
    activateChatMode();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom with smooth animation
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(indicator);
    scrollToBottom();
    return indicator;
}
// Event Listeners
sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Auto-resize textarea
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 140) + 'px';
});
    // When textarea resizes, adjust messages padding so nothing is hidden
