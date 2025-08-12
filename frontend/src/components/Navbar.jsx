import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login'); // or '/' if you want to go to register
  };

  return (
    <nav className="bg-indigo-600 p-4 text-white flex justify-between items-center">
      <div className="space-x-4">
        <Link to="/addblog" className="hover:underline">Add Blog</Link>
        <Link to="/myblogs" className="hover:underline">My Blogs</Link>
        <Link to="/allblogs" className="hover:underline">All Blogs</Link>
        <Link to="/aiblog" className="hover:underline">AI Generated Blog</Link> {/* New Link */}
      </div>
      <button
        onClick={handleLogout}
        className="bg-indigo-800 px-3 py-1 rounded hover:bg-indigo-700"
      >
        Logout
      </button>
    </nav>
  );
}
