import React from 'react';
import { Menu, LogIn, LogOut, Database, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onMenuClick, onOpenAuth }) {
  const { user, logout, dbStatus } = useAuth();

  return (
    <header className="sticky top-0 z-20 h-16 bg-slate-950/85 backdrop-blur border-b border-slate-800 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:bg-slate-800"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            Mode:{' '}
            <strong className={dbStatus === 'offline' ? 'text-amber-400' : 'text-emerald-400'}>
              {dbStatus === 'mongodb'
                ? 'MongoDB Connected'
                : dbStatus === 'offline'
                ? 'Offline'
                : 'Ready (Zero-Config Local Storage)'}
            </strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <UserCircle className="w-4 h-4 text-indigo-400" />
              <div className="text-xs">
                <span className="font-semibold text-white">{user.name}</span>
                <span className="text-slate-400 ml-1.5 capitalize">({user.role})</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </header>
  );
}
