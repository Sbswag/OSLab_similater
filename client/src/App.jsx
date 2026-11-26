import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';

import Dashboard from './pages/Dashboard';
import CpuSchedulingPage from './pages/CpuSchedulingPage';
import MemoryManagementPage from './pages/MemoryManagementPage';
import PageReplacementPage from './pages/PageReplacementPage';
import DeadlockPage from './pages/DeadlockPage';
import DiskSchedulingPage from './pages/DiskSchedulingPage';
import SynchronizationPage from './pages/SynchronizationPage';
import LearningModePage from './pages/LearningModePage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex">
          <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

          <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
            <Navbar
              onMenuClick={() => setMobileOpen(true)}
              onOpenAuth={() => setAuthOpen(true)}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard onOpenAuth={() => setAuthOpen(true)} />} />
                <Route path="/cpu" element={<CpuSchedulingPage />} />
                <Route path="/memory" element={<MemoryManagementPage />} />
                <Route path="/page-replacement" element={<PageReplacementPage />} />
                <Route path="/deadlock" element={<DeadlockPage />} />
                <Route path="/disk" element={<DiskSchedulingPage />} />
                <Route path="/synchronization" element={<SynchronizationPage />} />
                <Route path="/learning" element={<LearningModePage />} />
                <Route
                  path="/history"
                  element={<HistoryPage onOpenAuth={() => setAuthOpen(true)} />}
                />
              </Routes>
            </main>
          </div>

          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
