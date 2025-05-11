import React, { useState } from 'react';
import { DarkModeSwitch } from 'react-toggle-dark-mode'; // Import DarkModeSwitch

function Navbar({ darkMode, setDarkMode }) {
  const [showMenu, setShowMenu] = useState(false);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <div className="navbar">
      <div className="profile-section">
        <img
          src="https://via.placeholder.com/40"
          alt="Profile"
          onClick={() => setShowMenu(!showMenu)}
          className="profile-pic"
        />
        {showMenu && (
          <ul className="dropdown-menu">
            <li>View Profile</li>
            <li>Login</li>
            <li>Logout</li>
          </ul>
        )}
      </div>

      {/* Dark Mode Toggle */}
      <div className="mode-toggle">
        <DarkModeSwitch
          checked={darkMode}
          onChange={toggleDarkMode}
          size={24}
          sunColor="#facc15"
          moonColor="#e0e7ff"
        />
      </div>
    </div>
  );
}

export default Navbar;
