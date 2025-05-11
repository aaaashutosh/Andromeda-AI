import React from 'react';

function Sidebar({ setSelectedChat }) {
  const chats = ['Chat 1', 'Chat 2', 'Chat 3']; // Replace with real history

  return (
    <div className="sidebar">
      <button className="new-chat-btn" onClick={() => setSelectedChat(null)}>+ New Chat</button>
      <ul className="chat-list">
        {chats.map((chat, index) => (
          <li key={index} onClick={() => setSelectedChat(chat)}>{chat}</li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
