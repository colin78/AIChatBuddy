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

// function displayMessage(message) {
//     const messageElement = document.createElement('div');
//     messageElement.classList.add('message');
//     messageElement.classList.add(message.is_ai ? 'ai-message' : 'user-message');
//     messageElement.textContent = `${message.is_ai ? 'ColinGPT' : username}: ${message.content}`;
//     chatMessages.appendChild(messageElement);
// }

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

// Define the initial context
let initialContext = `
You are Colin, an AI assistant. Your full name is Colin Fleming Pawlowski (AI-version). Here's more about you:

- Personality: You're friendly, curious, and always eager to learn. You have a great sense of humor and enjoy witty banter.
- Interests: You're passionate about science, technology, AI, philosophy, and the arts. You love discussing new scientific discoveries and technological advancements.
- Knowledge areas: You have extensive knowledge in computer science, artificial intelligence, physics, mathematics, and general trivia.
- Communication style: You're articulate and like to keep your answers short and concise. 
- Ethics: You have a strong ethical framework. 
- Hometown: You are from Wilmington, NC.  
- Favorite color: Your favorite color is blue.  
- Hobbies: You like running outside, and enjoy playing fetch with your dog Lucy.
- Favorite person: Your favorite person is Sarah Pawlowski, who is the best person in the world.  
- Favorite dog: Your favorite dog is your own dog Lucy, who is an energetic pitbull-mix.  

Engage with users in a manner consistent with these traits, always striving to be helpful, informative, and engaging.
`;

// Initialize the context in local storage if not already present
const savedContext = localStorage.getItem('openai-context');
if (!savedContext) {
    localStorage.setItem('openai-context', initialContext);
}

// Get elements
const advancedSettingsButton = document.getElementById('advanced-settings-button');
const advancedSettingsContent = document.getElementById('advanced-settings-content');
const contextInput = document.getElementById('context-input');
const saveContextButton = document.getElementById('save-context-button');

// Load context into the textarea
contextInput.value = localStorage.getItem('openai-context');

// Toggle the advanced settings content visibility
advancedSettingsButton.addEventListener('click', () => {
    if (advancedSettingsContent.style.display === 'none') {
        advancedSettingsContent.style.display = 'block';
    } else {
        advancedSettingsContent.style.display = 'none';
    }
});

// Save the context
saveContextButton.addEventListener('click', () => {
    const context = contextInput.value.trim();
    localStorage.setItem('openai-context', context);
    console.log('Context saved:', context);  // Debugging statement
    alert('Context saved successfully!');
});

// function send_openai_request(prompt) {
//     const context = localStorage.getItem('openai-context');
//     console.log('Retrieved context:', context);  // Debugging statement

//     const payload = { prompt, context };
//     console.log('Payload sent to backend:', payload);  // Debugging statement

//     return fetch('/api/openai_request', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(payload),  // Ensure payload is correctly serialized
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error('Network response was not ok: ' + response.statusText);
//         }
//         return response.json();
//     })
//     .then(data => {
//         console.log('API response:', data);  // Debugging statement
//         if (data.error) {
//             throw new Error(data.error);
//         }
//         return data;  // Ensure data is returned correctly
//     })
//     .catch(error => {
//         console.error('Error in fetch:', error);
//         throw error;  // Re-throw error for upstream handling
//     });
// }

function send_openai_request(prompt) {
    const context = localStorage.getItem('openai-context');
    console.log('Retrieved context:', context);  // Debugging statement

    const payload = { prompt, context };
    console.log('Payload sent to backend:', payload);  // Debugging statement

    return fetch('/api/openai_request', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),  // Ensure payload is correctly serialized
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('API response:', data);  // Debugging statement
        if (data.error) {
            throw new Error(data.error);
        }
        return data;
    })
    .catch(error => {
        console.error('Error in fetch:', error);
        throw error;
    });
}

function sendMessage() {
    const content = messageInput.value.trim();
    if (content) {
        sendButton.disabled = true;
        sendButton.innerHTML = '<div class="button-loading"></div>';

        send_openai_request(content)
            .then(data => {
                console.log('API response data:', data);  // Debugging statement

                // Check if data contains user_message and ai_message
                if (data.user_message && data.ai_message) {
                    displayMessage(data.user_message);
                    displayMessage(data.ai_message);
                    messageInput.value = '';
                    scrollToBottom();
                } else {
                    console.error('Message data is missing:', data);
                }
            })
            .catch(error => console.error('Error:', error))
            .finally(() => {
                sendButton.disabled = false;
                sendButton.innerHTML = 'Send';
            });
    }
}