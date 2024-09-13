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
const startersList = document.getElementById('starters-list');

loginButton.addEventListener('click', login);
sendButton.addEventListener('click', sendMessage);
clearChatButton.addEventListener('click', clearChatHistory);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

function login() {
    console.log('Login function called');
    username = usernameInput.value.trim();
    if (username) {
        console.log('Username entered:', username);
        // Show the loading animation
        loginButton.disabled = true;
        loginButton.innerHTML = '<div class="button-loading"></div>';
        
        fetch('/api/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
        })
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('API response:', data);
            userId = data.id;
            loginContainer.style.display = 'none';
            chatContainer.style.display = 'block';
            loadChatHistory();
            loadConversationStarters();
        })
        .catch(error => {
            console.error('Error during login:', error);
        });
    } else {
        console.log('No username entered');
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

function displayMessage(message) {
    if (!message || !message.content) {
        console.error('Invalid message:', message);
        return;
    }
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

function sendMessage() {
    const content = messageInput.value.trim();
    console.log('Sending message:', content);
    if (content) {
        sendButton.disabled = true;
        sendButton.innerHTML = '<div class="button-loading"></div>';

        console.log('Sending POST request to /api/messages');
        fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId, content: content }),
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('API response data:', data);

            if (data.user_message && data.ai_message) {
                displayMessage(data.user_message);
                displayMessage(data.ai_message);
                messageInput.value = '';
                scrollToBottom();
            } else {
                console.error('Message data is missing:', data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while sending the message. Please try again.');
        })
        .finally(() => {
            sendButton.disabled = false;
            sendButton.innerHTML = 'Send';
        });
    } else {
        console.log('Empty message, not sending');
    }
}

const advancedSettingsButton = document.getElementById('advanced-settings-button');
const advancedSettingsContent = document.getElementById('advanced-settings-content');
const saveContextButton = document.getElementById('save-context-button');
const contextInput = document.getElementById('context-input');

advancedSettingsButton.addEventListener('click', () => {
    advancedSettingsContent.style.display = advancedSettingsContent.style.display === 'none' ? 'block' : 'none';
});

saveContextButton.addEventListener('click', () => {
    const newContext = contextInput.value.trim();
    if (newContext) {
        fetch('/api/context', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ context: newContext }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            alert('Context updated successfully');
        })
        .catch(error => {
            console.error('Error updating context:', error);
            alert('An error occurred while updating the context. Please try again.');
        });
    } else {
        alert('Context cannot be empty.');
    }
});
