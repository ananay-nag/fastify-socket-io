'use strict'
// code to load env file and vars
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') })

const fastify = require('fastify')({ logger: true })

// Register the Socket.IO plugin
fastify.register(require('@ananay-nag/fastify-socket-io'), {
  cors: {
    origin: '*',
    credentials: true
  }
})

// Web App HTML Template
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fastify Socket.IO Secure Chat</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #6366f1;
      --primary-hover: #818cf8;
      --bg: #0f172a;
      --surface: rgba(30, 41, 59, 0.7);
      --border: rgba(255, 255, 255, 0.1);
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    body {
      font-family: 'Outfit', sans-serif;
      background: var(--bg);
      background-image: 
        radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(236, 72, 153, 0.15) 0px, transparent 50%);
      color: var(--text);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .glass-panel {
      background: var(--surface);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      padding: 2.5rem;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      width: 100%;
      max-width: 480px;
    }
    h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      background: linear-gradient(to right, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-align: center;
    }
    p.subtitle {
      color: var(--text-muted);
      margin-bottom: 2rem;
      margin-top: 0;
      text-align: center;
    }
    .chat-box {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border);
      border-radius: 16px;
      height: 300px;
      overflow-y: auto;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .msg {
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      max-width: 80%;
      animation: slideIn 0.3s ease-out forwards;
      opacity: 0;
      transform: translateY(10px);
      word-wrap: break-word;
    }
    @keyframes slideIn {
      to { opacity: 1; transform: translateY(0); }
    }
    .msg.system {
      background: rgba(255, 255, 255, 0.05);
      align-self: center;
      font-size: 0.85rem;
      color: var(--text-muted);
      text-align: center;
    }
    .msg.user {
      background: var(--primary);
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .msg.server {
      background: rgba(255, 255, 255, 0.1);
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .msg-header {
      font-size: 0.75rem;
      opacity: 0.8;
      margin-bottom: 0.25rem;
      font-weight: 600;
    }
    .input-group, .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .input-group.row {
      flex-direction: row;
    }
    input {
      flex: 1;
      padding: 1rem 1.5rem;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border);
      border-radius: 9999px;
      color: var(--text);
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus {
      border-color: var(--primary);
    }
    button {
      background: var(--primary);
      color: white;
      border: none;
      padding: 1rem 1.5rem;
      border-radius: 9999px;
      font-family: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    button:hover {
      background: var(--primary-hover);
    }
    button:active {
      transform: scale(0.95);
    }
    .error-msg {
      color: #ef4444;
      font-size: 0.875rem;
      text-align: center;
      margin-top: 0.5rem;
    }
    /* Scrollbar styling */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
    
    /* Toggle states */
    #chat-section { display: none; }
  </style>
</head>
<body>
  <div class="glass-panel">
    <h1>Secure Chat</h1>
    <p class="subtitle">Powered by @ananay-nag/fastify-socket-io</p>
    
    <!-- Login Section -->
    <div id="login-section" class="form-group">
      <input type="text" id="nameInput" placeholder="Your Name (max 20 chars)" autocomplete="off" />
      <input type="password" id="codeInput" placeholder="Secret Code (abc@123)" autocomplete="off" />
      <button id="joinBtn">Join Chat</button>
      <div id="loginError" class="error-msg"></div>
    </div>

    <!-- Chat Section -->
    <div id="chat-section">
      <div class="chat-box" id="messages"></div>
      
      <div class="input-group row">
        <input type="text" id="msgInput" placeholder="Type a message..." autocomplete="off" />
        <button id="sendBtn">Send</button>
      </div>
    </div>
  </div>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    let socket;
    let myName = '';
    const loginSection = document.getElementById('login-section');
    const chatSection = document.getElementById('chat-section');
    const messages = document.getElementById('messages');
    const msgInput = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');
    const nameInput = document.getElementById('nameInput');
    const codeInput = document.getElementById('codeInput');
    const joinBtn = document.getElementById('joinBtn');
    const loginError = document.getElementById('loginError');

    function addMessage(type, text, sender = null) {
      const msgDiv = document.createElement('div');
      msgDiv.className = \`msg \${type}\`;
      
      if (sender && type === 'server') {
        const header = document.createElement('div');
        header.className = 'msg-header';
        header.textContent = sender;
        msgDiv.appendChild(header);
      }
      
      const content = document.createElement('div');
      content.textContent = text;
      msgDiv.appendChild(content);
      
      messages.appendChild(msgDiv);
      messages.scrollTop = messages.scrollHeight;
    }

    function initSocket() {
      myName = nameInput.value.trim();
      const code = codeInput.value.trim();
      
      if (!myName || !code) {
        loginError.textContent = 'Please enter both name and code.';
        return;
      }

      loginError.textContent = 'Connecting...';
      
      // Connect to Socket.IO with auth credentials
      socket = io({
        auth: {
          name: myName,
          code: code
        }
      });

      socket.on('connect', () => {
        loginSection.style.display = 'none';
        chatSection.style.display = 'block';
        addMessage('system', 'Connected to the chat room');
      });

      socket.on('connect_error', (err) => {
        loginError.textContent = err.message;
        socket.disconnect();
      });

      socket.on('message', (data) => {
        addMessage('server', data.text, data.sender);
      });

      socket.on('user_joined', (name) => {
        addMessage('system', \`\${name} joined the chat\`);
      });

      socket.on('user_left', (name) => {
        addMessage('system', \`\${name} left the chat\`);
      });

      socket.on('disconnect', () => {
        addMessage('system', 'Disconnected from server');
        loginSection.style.display = 'flex';
        chatSection.style.display = 'none';
      });
    }

    joinBtn.addEventListener('click', initSocket);
    codeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') initSocket();
    });

    function sendMessage() {
      const text = msgInput.value.trim();
      if (text && socket) {
        addMessage('user', text);
        socket.emit('message', text);
        msgInput.value = '';
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    msgInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  </script>
</body>
</html>
`

// Serve the HTML
fastify.get('/', (req, reply) => {
  reply.type('text/html').send(html)
})

fastify.ready(err => {
  if (err) throw err

  // Middleware for authentication
  console.log(process.env.SECRET_CODE)
  fastify.io.use((socket, next) => {
    const code = socket.handshake.auth.code
    const name = socket.handshake.auth.name
    console.log(code, process.env.SECRET_CODE)
    const expectedCode = process.env.SECRET_CODE
    if (code !== expectedCode) {
      return next(new Error('Invalid secret code'))
    }
    if (!name || name.length > 20) {
      return next(new Error('Invalid name'))
    }

    socket.data.name = name
    next()
  })

  // Handle Socket.IO connections
  fastify.io.on('connection', (socket) => {
    const userName = socket.data.name
    fastify.log.info(`socket connected: ${userName}`)

    // Notify others that a user joined
    socket.broadcast.emit('user_joined', userName)

    socket.on('message', (text) => {
      fastify.log.info(`received from ${userName}: ${text}`)
      // Broadcast to everyone else
      socket.broadcast.emit('message', {
        sender: userName,
        text
      })
    })

    socket.on('disconnect', () => {
      fastify.log.info(`socket disconnected: ${userName}`)
      // Notify others that a user left
      socket.broadcast.emit('user_left', userName)
    })
  })
})

fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  fastify.log.info('Web app available at http://localhost:3000')
})
