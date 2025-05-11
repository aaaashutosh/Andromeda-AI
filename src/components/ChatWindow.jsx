import React from 'react';
import TypingIndicator from './TypingIndicator';

function ChatWindow({ messages, input, setInput, handleSend, loading }) {
  return (
    <div className="chat-window">
      <header className="chat-header">🤖 Andromeda</header>

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            {msg.text}
          </div>
        ))}
        {loading && <TypingIndicator />}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} disabled={loading}>Send</button>
      </div>

      <footer className="footer">
        <p>
          Created by{' '}
          <a href="https://aashutoshkhatiwada.com.np" target="_blank" rel="noopener noreferrer">
            Aashutosh
          </a>
        </p>
      </footer>
    </div>
  );
}

export default ChatWindow;
