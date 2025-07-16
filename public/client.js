// client.js
// Handles client-side chat logic with Supabase Auth (short random ID + password)

const SUPABASE_URL = 'https://hksohnvghkhyffmdmndw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrc29obnZnaGtoeWZmbWRtbmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NzcwNDcsImV4cCI6MjA2ODE1MzA0N30.X03p6gJtXnD5_fdQnneUDCSSAJgkF-Nq_V9HfcJZuvU';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let userId = '';
let socket = null;
let currentDM = null; // The user ID of the DM partner, or null for no DM
let dmPartners = new Set();
let unreadPartners = new Set();

// DOM elements
const authModal = document.getElementById('auth-modal');
const logoutBtn = document.getElementById('logout-btn');
const chatMessages = document.getElementById('chat-messages');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const dmForm = document.getElementById('dm-form');
const dmUserIdInput = document.getElementById('dm-user-id');
const currentDmDiv = document.getElementById('current-dm');
const noDmMsg = document.getElementById('no-dm-msg');
const messageInputField = document.getElementById('message-input');
const messageSendBtn = document.querySelector('#message-form button');
const dmHistoryList = document.getElementById('dm-history-list');
const authTabs = document.getElementById('auth-tabs');
const showSignupBtn = document.getElementById('show-signup');
const showLoginBtn = document.getElementById('show-login');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const signupPassword = document.getElementById('signup-password');
const signupIdInfo = document.getElementById('signup-id-info');
const loginId = document.getElementById('login-id');
const loginPassword = document.getElementById('login-password');
const userIdPanel = document.getElementById('user-id-panel');
const currentUserIdSpan = document.getElementById('current-user-id');
const copyUserIdBtn = document.getElementById('copy-user-id');
const signupUserId = document.getElementById('signup-user-id');
const signupRandomIdBtn = document.getElementById('signup-random-id');
const signupError = document.getElementById('signup-error');

// Helper to generate a short random ID (8 characters)
function generateShortID(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Helper to validate user ID
function validateUserId(id) {
    return /^[a-z0-9]{4,16}$/.test(id);
}

// Switch between signup and login
showSignupBtn.onclick = () => {
    showSignupBtn.classList.add('active');
    showLoginBtn.classList.remove('active');
    signupForm.style.display = 'block';
    loginForm.style.display = 'none';
    signupIdInfo.style.display = 'none';
};
showLoginBtn.onclick = () => {
    showLoginBtn.classList.add('active');
    showSignupBtn.classList.remove('active');
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
};

// Signup logic
signupRandomIdBtn.onclick = () => {
    const randomId = generateShortID(8).toLowerCase();
    signupUserId.value = randomId;
    signupError.style.display = 'none';
};

signupForm.onsubmit = async (e) => {
    e.preventDefault();
    signupError.style.display = 'none';
    let id = signupUserId.value.trim().toLowerCase();
    const password = signupPassword.value.trim();
    if (!id) {
        id = generateShortID(8).toLowerCase();
        signupUserId.value = id;
    }
    if (!validateUserId(id)) {
        signupError.textContent = 'ID must be 4-16 lowercase letters or numbers.';
        signupError.style.display = 'block';
        return;
    }
    if (password.length < 6) {
        signupError.textContent = 'Password must be at least 6 characters.';
        signupError.style.display = 'block';
        return;
    }
    const email = `${id}@anonmail.com`;
    // Try to sign up; if already registered, show error
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
        if (error.message && error.message.toLowerCase().includes('already registered')) {
            signupError.textContent = 'This ID is already taken. Please choose another or use Random.';
        } else {
            signupError.textContent = 'Signup failed: ' + error.message;
        }
        signupError.style.display = 'block';
        return;
    }
    signupIdInfo.style.display = 'block';
    signupIdInfo.innerHTML = `<b>Your User ID:</b><br>${id}<br><span style='color:#b00;'>Save this ID! You will need it to log in.</span>`;
    signupPassword.value = '';
    signupUserId.value = '';
};

// Login logic
loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const id = loginId.value.trim().toLowerCase();
    const password = loginPassword.value.trim();
    if (!id || !password) return alert('Enter your ID and password.');
    const email = `${id}@anonmail.com`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        alert('Login failed: ' + error.message);
        return;
    }
    loginId.value = '';
    loginPassword.value = '';
    checkAuth();
};

// Check authentication and initialize UI
async function checkAuth() {
    const { data } = await supabase.auth.getSession();
    if (data.session && data.session.user) {
        userId = data.session.user.email.split('@')[0].toLowerCase();
        authModal.style.display = 'none';
        logoutBtn.style.display = 'block';
        connectSocket();
        resetChatUI();
        await loadDmPartners();
        currentUserIdSpan.textContent = userId;
        userIdPanel.style.display = 'flex';
    } else {
        authModal.style.display = 'flex';
        logoutBtn.style.display = 'none';
        resetChatUI();
        userIdPanel.style.display = 'none';
    }
}

// Reset chat UI and state
function resetChatUI() {
    chatMessages.innerHTML = '';
    currentDM = null;
    currentDmDiv.textContent = '';
    messageInputField.disabled = true;
    messageSendBtn.disabled = true;
    noDmMsg.style.display = 'block';
    dmUserIdInput.value = '';
    dmPartners = new Set();
    unreadPartners = new Set();
    renderDmPartners();
}

// Logout logic
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    userId = '';
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    authModal.style.display = 'flex';
    logoutBtn.style.display = 'none';
    resetChatUI();
    userIdPanel.style.display = 'none';
});

// Handle DM form submit
if (dmForm) {
    dmForm.onsubmit = (e) => {
        e.preventDefault();
        const val = dmUserIdInput.value.trim().toLowerCase();
        if (val && val !== userId) {
            // Clear unread status when switching to a chat
            if (unreadPartners.has(val)) {
                unreadPartners.delete(val);
            }
            currentDM = val;
            currentDmDiv.textContent = `Direct messaging with User ${val}`;
            messageInputField.disabled = false;
            messageSendBtn.disabled = false;
            noDmMsg.style.display = 'none';
            chatMessages.innerHTML = '';
            loadChatHistory();
            updateDmPartnersWith(val); // This also re-renders the list
        } else {
            currentDM = null;
            currentDmDiv.textContent = '';
            messageInputField.disabled = true;
            messageSendBtn.disabled = true;
            noDmMsg.style.display = 'block';
            chatMessages.innerHTML = '';
        }
    };
}

// Connect to Socket.io and handle chat
function connectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    socket = io();

    socket.on('connect', () => {
        console.log(`[CLIENT] Connected with socket ID: ${socket.id}`);
        if (userId) {
            console.log(`[CLIENT] Emitting 'join' with user ID: ${userId}`);
            socket.emit('join', userId.toLowerCase());
        }
    });

    // Only allow sending messages if a DM partner is selected
    messageForm.onsubmit = async (e) => {
        e.preventDefault();
        if (!userId || !currentDM) return;
        if (currentDM === userId) {
            alert("You cannot send a message to yourself.");
            return;
        }
        const msg = messageInput.value.trim();
        if (msg) {
            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            appendMessage({ userId, msg, timestamp, self: true });
            console.log(`[CLIENT] Emitting 'chat-message' to '${currentDM}': "${msg}"`);
            socket.emit('chat-message', msg, currentDM);
            messageInput.value = '';
            // Save to Supabase
            await supabase.from('messages').insert({ user_id: userId, content: msg, recipient_id: currentDM });
            updateDmPartnersWith(currentDM);
        }
    };

    // Listen for incoming messages
    socket.on('chat-message', (data) => {
        console.log('[CLIENT] Received a message:', data);

        // Make sure the message is for me.
        if (data.recipient_id !== userId) {
            console.log('[CLIENT] Discarding message not intended for me.');
            return;
        }

        // If the message is from the person I'm currently chatting with, display it.
        if (data.userId === currentDM) {
            console.log('[CLIENT] Message is from current DM partner. Displaying.');
            appendMessage({ ...data, self: false });
        } else {
            console.log(`[CLIENT] Notification: New message from '${data.userId}'`);
            unreadPartners.add(data.userId);
            renderDmPartners(); // Re-render to show notification dot
        }

        // Always update the partner list when a new message arrives.
        updateDmPartnersWith(data.userId);
    });

    // Show when a user joins
//  socket.on('user-joined', (id) => {
//      appendSystemMessage(`User ${id} joined the chat`);
//  });

    // Show when a user leaves
//  socket.on('user-left', (id) => {
//      appendSystemMessage(`User ${id} left the chat`);
//  });
}

// Load chat history for the current DM
async function loadChatHistory() {
    if (!currentDM) return;
    let query = supabase.from('messages').select('*').order('created_at', { ascending: true });
    query = query.or(`and(user_id.eq.${userId},recipient_id.eq.${currentDM}),and(user_id.eq.${currentDM},recipient_id.eq.${userId})`);
    const { data, error } = await query;
    chatMessages.innerHTML = '';
    if (!error && data) {
        data.forEach(msg => {
            appendMessage({
                userId: msg.user_id,
                msg: msg.content,
                timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                self: msg.user_id === userId
            });
        });
    }
}

// Append a chat message to the chat area
function appendMessage({ userId: id, msg, timestamp, self }) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(self ? 'self' : 'other');
    msgDiv.innerHTML = `
        <div><strong>User ${id}</strong></div>
        <div>${msg}</div>
        <div class="meta">${timestamp}</div>
    `;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Append a system message (join/leave)
function appendSystemMessage(text) {
    const sysDiv = document.createElement('div');
    sysDiv.className = 'system-message';
    sysDiv.textContent = text;
    chatMessages.appendChild(sysDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Save DM partners to localStorage for the current user
function saveDmPartners() {
    if (userId) {
        localStorage.setItem('dmPartners_' + userId, JSON.stringify(Array.from(dmPartners)));
    }
}

// Load DM partners from localStorage for the current user
function loadDmPartnersFromStorage() {
    if (userId) {
        const saved = localStorage.getItem('dmPartners_' + userId);
        if (saved) {
            dmPartners = new Set(JSON.parse(saved));
        }
    }
}

// Update DM partners after sending/receiving a message or starting a DM
function updateDmPartnersWith(id) {
    if (id && id !== userId) {
        dmPartners.add(id);
        saveDmPartners();
        renderDmPartners();
    }
}

// On login, load DM partners from storage and then from Supabase (to merge)
async function loadDmPartners() {
    if (!userId) return;
    loadDmPartnersFromStorage();
    renderDmPartners();
    // Also fetch from Supabase to merge any new partners from server-side history
    const { data, error } = await supabase
        .from('messages')
        .select('user_id,recipient_id')
        .or(`user_id.eq.${userId},recipient_id.eq.${userId}`);
    let newPartners = new Set();
    if (!error && data) {
        data.forEach(row => {
            if (row.user_id && row.user_id !== userId) newPartners.add(row.user_id);
            if (row.recipient_id && row.recipient_id !== userId) newPartners.add(row.recipient_id);
        });
    }
    let changed = false;
    newPartners.forEach(id => {
        if (!dmPartners.has(id)) {
            dmPartners.add(id);
            changed = true;
        }
    });
    if (changed) saveDmPartners();
    renderDmPartners();
}

function renderDmPartners() {
    dmHistoryList.innerHTML = '';
    if (dmPartners.size === 0) {
        dmHistoryList.innerHTML = '<li style="color:#888;">No previous chats</li>';
        return;
    }
    dmPartners.forEach(id => {
        const li = document.createElement('li');
        li.textContent = id;
        if (currentDM === id) li.classList.add('active');
        
        // Add notification class if there are unread messages
        if (unreadPartners.has(id)) {
            li.classList.add('unread');
        }

        li.onclick = () => {
            // When switching to a chat, remove it from the unread set
            if (unreadPartners.has(id)) {
                unreadPartners.delete(id);
            }
            if (currentDM !== id) {
                dmUserIdInput.value = id;
                chatMessages.innerHTML = '';
                dmForm.dispatchEvent(new Event('submit'));
            }
        };
        dmHistoryList.appendChild(li);
    });
}

// On load, check auth
checkAuth(); 

// Copy to clipboard logic
copyUserIdBtn.onclick = () => {
    // Always get the current userId from the variable, not from the DOM
    if (userId) {
        navigator.clipboard.writeText(userId).then(() => {
            copyUserIdBtn.textContent = 'Copied!';
            setTimeout(() => { copyUserIdBtn.textContent = 'Copy'; }, 1200);
        });
    }
}; 