import React, { useState } from 'react';
import { User, Ticket, TicketStatus } from './types';
import { INITIAL_TICKETS } from './constants';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { NewEntryForm } from './components/NewEntryForm';
import { TicketList } from './components/TicketList';
import { TicketWorkflow } from './components/TicketWorkflow';
import { SidebarWidgets } from './components/SidebarWidgets';
import { LayoutGrid, PlusCircle, List, LogOut, Radio, Menu, X } from 'lucide-react';

// Main App Component
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [currentView, setCurrentView] = useState<'dashboard' | 'list' | 'new'>('dashboard');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
  };

  const handleAddTicket = (ticket: Ticket) => {
    setTickets([ticket, ...tickets]);
    setCurrentView('list');
    setIsMobileMenuOpen(false); // Close menu on mobile after action
  };

  const handleDeleteTicket = (ticketId: string) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
    if(selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(null);
    }
  };

  const handleBulkImport = (newTickets: Ticket[]) => {
      setTickets(prev => [...newTickets, ...prev]);
  };

  const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus, note: string) => {
    if (!user) return;
    
    const updateTicket = (t: Ticket): Ticket => ({
        ...t,
        currentStatus: newStatus,
        history: [
          ...t.history,
          {
            date: new Date().toISOString(),
            status: newStatus,
            note,
            updatedBy: user.name
          }
        ]
    });

    setTickets(prevTickets => prevTickets.map(t => {
      if (t.id === ticketId) {
        return updateTicket(t);
      }
      return t;
    }));

    if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => prev ? updateTicket(prev) : null);
    }
  };

  const handleUpdateValue = (ticketId: string, newValue: number) => {
      if(!user) return;

      const updateTicket = (t: Ticket): Ticket => ({
          ...t,
          value: newValue,
          history: [
              ...t.history,
              {
                  date: new Date().toISOString(),
                  status: t.currentStatus,
                  note: `Valor atualizado para R$ ${newValue}`,
                  updatedBy: user.name
              }
          ]
      });

      setTickets(prev => prev.map(t => t.id === ticketId ? updateTicket(t) : t));
      if(selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(prev => prev ? updateTicket(prev) : null);
      }
  };

  const handleUpdateAttachment = (ticketId: string, file: File) => {
      if(!user) return;
      
      const updateTicket = (t: Ticket): Ticket => ({
          ...t,
          attachmentName: file.name,
          attachmentUrl: URL.createObjectURL(file), // Create fake URL
          history: [
              ...t.history,
              {
                  date: new Date().toISOString(),
                  status: t.currentStatus,
                  note: `Anexo atualizado: ${file.name}`,
                  updatedBy: user.name
              }
          ]
      });

      setTickets(prev => prev.map(t => t.id === ticketId ? updateTicket(t) : t));
      if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(prev => prev ? updateTicket(prev) : null);
      }
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // --- Sidebar Content Component ---
  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800 bg-slate-950">
           <Radio className="h-8 w-8 text-blue-500 animate-pulse" />
           <div>
               <h1 className="text-lg font-bold tracking-tight text-white">TelcoFlow</h1>
               <p className="text-xs text-slate-400">Manager Pro v2.0</p>
           </div>
           {/* Close button for mobile inside sidebar */}
           <button 
             onClick={() => setIsMobileMenuOpen(false)} 
             className="md:hidden ml-auto text-slate-400 hover:text-white"
           >
             <X className="h-6 w-6" />
           </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <button 
              onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-300 hover:bg-slate-800 hover:pl-5'}`}
          >
              <LayoutGrid className="h-5 w-5" />
              <span>Painel</span>
          </button>
          <button 
              onClick={() => { setCurrentView('list'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentView === 'list' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-300 hover:bg-slate-800 hover:pl-5'}`}
          >
              <List className="h-5 w-5" />
              <span>Esteira / Tickets</span>
          </button>
          <button 
              onClick={() => { setCurrentView('new'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentView === 'new' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-300 hover:bg-slate-800 hover:pl-5'}`}
          >
              <PlusCircle className="h-5 w-5" />
              <span>Nova Entrada</span>
          </button>
      </nav>

      {/* Widgets Area */}
      <SidebarWidgets />

      <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3 mb-4 px-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold shadow-md text-white">
                  {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate text-white">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.role}</p>
              </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center space-x-2 px-2 py-2 text-red-400 hover:text-red-300 transition-colors text-sm hover:bg-red-900/10 rounded-md">
              <LogOut className="h-4 w-4" />
              <span>Sair do Sistema</span>
          </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      
      {/* Sidebar Desktop (Static) & Mobile (Off-canvas) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Mobile Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md z-30 sticky top-0">
           <div className="flex items-center space-x-2">
              <Radio className="h-6 w-6 text-blue-500" />
              <span className="font-bold">TelcoFlow</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 rounded hover:bg-slate-800">
              <Menu className="h-6 w-6" />
           </button>
        </header>

        {/* Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
            <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-between md:items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="mb-2 md:mb-0">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800">
                        {currentView === 'dashboard' && 'Visão Geral'}
                        {currentView === 'list' && 'Gerenciamento de Esteira'}
                        {currentView === 'new' && 'Cadastro de Demanda'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Gerencie o fluxo de B2B e Desligue Cobre com eficiência.</p>
                </div>
                <div className="flex flex-col md:items-end items-start">
                    <span className="inline-flex px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                        RA: {user.ra}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 capitalize">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
            </header>

            {currentView === 'dashboard' && <Dashboard tickets={tickets} />}
            {currentView === 'list' && <TicketList tickets={tickets} onViewDetail={setSelectedTicket} onDelete={handleDeleteTicket} onImport={handleBulkImport} />}
            {currentView === 'new' && <NewEntryForm user={user} onSubmit={handleAddTicket} onCancel={() => setCurrentView('dashboard')} />}
        </main>
      </div>

      {selectedTicket && (
        <TicketWorkflow 
            ticket={selectedTicket} 
            tickets={tickets}
            user={user} 
            onClose={() => setSelectedTicket(null)} 
            onUpdateStatus={handleUpdateStatus}
            onUpdateAttachment={handleUpdateAttachment}
            onUpdateValue={handleUpdateValue}
            onDelete={handleDeleteTicket}
        />
      )}
    </div>
  );
};

export default App;