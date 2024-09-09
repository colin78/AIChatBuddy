let userId = null;
let username = null;

const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const usernameInput = document.getElementById('username-input');
const loginButton = document.getElementById('login-button');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const clearChatButton = document.getElementById('clear-chat-button');
const settingsButton = document.getElementById('settings-button');
const startersList = document.getElementById('starters-list');

loginButton.addEventListener('click', login);
sendButton.addEventListener('click', sendMessage);
clearChatButton.addEventListener('click', clearChatHistory);
settingsButton.addEventListener('click', openSettings);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

function login() {
    username = usernameInput.value.trim();
    if (username) {
        fetch('/api/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
        })
        .then(response => response.json())
        .then(data => {
            userId = data.id;
            loginContainer.style.display = 'none';
            chatContainer.style.display = 'block';
            loadChatHistory();
            loadConversationStarters();
        })
        .catch(error => console.error('Error:', error));
    }
}

function loadChatHistory() {
    fetch(`/api/messages/${userId}`)
        .then(response => response.json())
        .then(messages => {
            chatMessages.innerHTML = '';
            messages.forEach(message => {
                displayMessage(message);
            });
            scrollToBottom();
        })
        .catch(error => console.error('Error:', error));
}

function sendMessage() {
    const content = messageInput.value.trim();
    if (content) {
        fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId, content }),
        })
        .then(response => response.json())
        .then(data => {
            displayMessage(data.user_message);
            displayMessage(data.ai_message);
            messageInput.value = '';
            scrollToBottom();
        })
        .catch(error => console.error('Error:', error));
    }
}

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(message.is_ai ? 'ai-message' : 'user-message');
    messageElement.textContent = `${message.is_ai ? 'ColinGPT' : username}: ${message.content}`;
    chatMessages.appendChild(messageElement);
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function clearChatHistory() {
    fetch(`/api/messages/${userId}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        chatMessages.innerHTML = '';
    })
    .catch(error => console.error('Error:', error));
}

function openSettings() {
    alert('Settings functionality coming soon!');
}

function loadConversationStarters() {
    fetch('/api/conversation_starters')
        .then(response => response.json())
        .then(starters => {
            startersList.innerHTML = '';
            starters.forEach(starter => {
                const li = document.createElement('li');
                li.textContent = starter;
                li.addEventListener('click', () => {
                    messageInput.value = starter;
                    sendMessage();
                });
                startersList.appendChild(li);
            });
        })
        .catch(error => console.error('Error:', error));
}
