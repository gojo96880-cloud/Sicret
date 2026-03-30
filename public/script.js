const socket = io();
const chatBox = document.getElementById('chat-box');
const form = document.getElementById('chat-form');
const input = document.getElementById('msg-input');

// Carica i vecchi messaggi
fetch('/api/messages')
  .then(r => r.json())
  .then(messages => {
    chatBox.innerHTML = '';
    messages.forEach(m => addMsg(m));
  });

function addMsg(msg) {
  chatBox.innerHTML += `<div><b>${msg.user}:</b> ${msg.text} <span style="font-size:0.8em;color:gray">(${msg.time})</span></div>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

form.addEventListener('submit', function(e) {
  e.preventDefault();
  const now = new Date();
  const msgObj = {
    user: '', // username lato server
    text: input.value,
    time: now.toLocaleTimeString()
  };
  // Prendi il nome utente dalla sessione (il server lo aggiunge in modo sicuro)
  socket.emit('chat message', msgObj);
  input.value = '';
});

socket.on('chat message', addMsg);
