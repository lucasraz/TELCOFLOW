import React, { useState, useEffect } from 'react';
import { User, Ticket, TicketStatus } from './types';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { NewEntryForm } from './components/NewEntryForm';
import { TicketList } from './components/TicketList';
import { TicketWorkflow } from './components/TicketWorkflow';
import { SidebarWidgets } from './components/SidebarWidgets';
import { LayoutGrid, PlusCircle, List, LogOut, Radio, Menu, X } from 'lucide-react';
import { supabase } from './supabaseClient';

// Main App Component
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'list' | 'new'>('dashboard');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check active session on mount
  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
             const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
             if (profile) {
                 setUser({
                     id: session.user.id,
                     email: session.user.email,
                     name: profile.name,
                     ra: profile.ra,
                     role: profile.role,
                     networkLogin: profile.network_login
                 });
                 fetchTickets();
             }
        }
    };
    checkSession();
  }, []);

  const fetchTickets = async () => {
      setLoading(true);
      const { data: ticketsData, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false }); // Ordenar por mais recente

      if (error) {
          console.error('Error fetching tickets:', error);
          setLoading(false);
          return;
      }

      // Fetch histories for these tickets (Doing it simply for now, typically we'd join or fetch on demand)
      const ticketsWithHistory: Ticket[] = await Promise.all(ticketsData.map(async (t: any) => {
          const { data: history } = await supabase.from('ticket_history').select('*').eq('ticket_id', t.id);
          return {
              id: t.id,
              ardName: t.ard_name,
              coordinates: t.coordinates,
              clientCoordinates: t.client_coordinates,
              uf: t.uf,
              city: t.city,
              requester: t.requester,
              type: t.type,
              client: t.client,
              value: parseFloat(t.value),
              currentStatus: t.current_status,
              createdAt: t.created_at,
              entryDate: t.entry_date,
              attachmentName: t.attachment_name,
              attachmentUrl: t.attachment_url,
              isSubstitute: t.is_substitute,
              previousTicketId: t.previous_ticket_id,
              user_id: t.user_id,
              history: history?.map((h: any) => ({
                  id: h.id,
                  date: h.date,
                  status: h.status,
                  note: h.note,
                  updatedBy: h.updated_by
              })) || []
          };
      }));
      
      setTickets(ticketsWithHistory);
      setLoading(false);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    fetchTickets();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTickets([]);
    setCurrentView('dashboard');
  };

  const handleAddTicket = async (ticket: Ticket, attachmentFile: File | null) => {
    if (!user) return;
    setLoading(true);

    let finalAttachmentUrl = undefined;
    let finalAttachmentName = undefined;

    // 1. Upload File if exists
    if (attachmentFile) {
        const fileName = `${ticket.id}-${Date.now()}-${attachmentFile.name}`;
        const { error: uploadError } = await supabase.storage.from('attachments').upload(fileName, attachmentFile);
        
        if (uploadError) {
             alert('Aviso: O ticket será criado, mas houve erro no upload do anexo: ' + uploadError.message);
        } else {
             const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(fileName);
             finalAttachmentUrl = publicUrl;
             finalAttachmentName = attachmentFile.name;
        }
    }
    
    // 2. Insert into DB
    const { error } = await supabase.from('tickets').insert({
        id: ticket.id.trim(), // Ensure no whitespace
        user_id: user.id,
        ard_name: ticket.ardName,
        coordinates: ticket.coordinates,
        client_coordinates: ticket.clientCoordinates || null,
        uf: ticket.uf,
        city: ticket.city,
        requester: ticket.requester,
        type: ticket.type,
        client: ticket.client || null,
        value: ticket.value || 0,
        current_status: ticket.currentStatus,
        entry_date: ticket.entryDate,
        is_substitute: ticket.isSubstitute,
        previous_ticket_id: ticket.previousTicketId || null,
        attachment_name: finalAttachmentName || null,
        attachment_url: finalAttachmentUrl || null
    });

    if (error) {
        alert("Erro ao criar ticket: " + error.message);
        setLoading(false);
        return;
    }
    
    // 3. Insert History
    await supabase.from('ticket_history').insert({
        ticket_id: ticket.id.trim(),
        status: ticket.currentStatus,
        note: ticket.history[0].note,
        updated_by: user.name
    });

    await fetchTickets();
    setLoading(false);
    setCurrentView('list');
    setIsMobileMenuOpen(false);
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
        // Agora confiamos que o ON DELETE CASCADE está configurado corretamente no banco.
        // Isso apagará o ticket e automaticamente o histórico associado.
        const { error: ticketError } = await supabase.from('tickets').delete().eq('id', ticketId);

        if (ticketError) {
            console.error("Erro delete ticket:", ticketError);
            alert(`Erro ao deletar o ticket: ${ticketError.message}`);
            return;
        }

        // Atualiza o estado local removendo o item
        setTickets(prev => prev.filter(t => t.id !== ticketId));
        
        // Se o ticket deletado estiver aberto no modal, fecha ele
        if(selectedTicket && selectedTicket.id === ticketId) {
            setSelectedTicket(null);
        }
    } catch (err: any) {
         console.error("Erro inesperado:", err);
         alert("Ocorreu um erro inesperado ao tentar deletar.");
    }
  };

  const handleBulkImport = async (newTickets: Ticket[]) => {
      if(!user) return;
      setLoading(true);

      for (const t of newTickets) {
          const { error } = await supabase.from('tickets').insert({
              id: t.id.trim(),
              user_id: user.id,
              ard_name: t.ardName,
              coordinates: t.coordinates,
              uf: t.uf,
              city: t.city,
              requester: t.requester,
              type: t.type,
              client: t.client || null,
              value: 0,
              current_status: t.currentStatus,
              entry_date: t.entryDate,
              is_substitute: t.isSubstitute,
              previous_ticket_id: t.previousTicketId || null
          });
          
          if (!error) {
              await supabase.from('ticket_history').insert({
                  ticket_id: t.id.trim(),
                  status: t.currentStatus,
                  note: 'Importação em massa',
                  updated_by: user.name
              });
          }
      }
      await fetchTickets();
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus, note: string) => {
    if (!user) return;
    
    const { error } = await supabase.from('tickets').update({ current_status: newStatus }).eq('id', ticketId);
    
    if (error) {
        alert(`Erro ao atualizar status: ${error.message}`);
        return;
    }

    // Sucesso ao atualizar ticket, insere histórico
    await supabase.from('ticket_history').insert({
        ticket_id: ticketId,
        status: newStatus,
        note: note,
        updated_by: user.name
    });
    
    await fetchTickets(); // Refresh
    
    // Update local state optimistic
    if (selectedTicket && selectedTicket.id === ticketId) {
            const updatedTicket = {
                ...selectedTicket,
                currentStatus: newStatus,
                history: [...selectedTicket.history, { date: new Date().toISOString(), status: newStatus, note, updatedBy: user.name }]
            };
            setSelectedTicket(updatedTicket);
    }
  };

  const handleUpdateValue = async (ticketId: string, newValue: number) => {
      if(!user) return;

      const { error } = await supabase.from('tickets').update({ value: newValue }).eq('id', ticketId);
      if(!error) {
          await supabase.from('ticket_history').insert({
              ticket_id: ticketId,
              status: selectedTicket?.currentStatus || TicketStatus.RECEBIDO,
              note: `Valor atualizado para R$ ${newValue}`,
              updated_by: user.name
          });
          await fetchTickets();
          if (selectedTicket) setSelectedTicket({...selectedTicket, value: newValue});
      } else {
          alert("Erro ao atualizar valor: " + error.message);
      }
  };

  const handleUpdateAttachment = async (ticketId: string, file: File) => {
      if(!user) return;

      const fileName = `${ticketId}-${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from('attachments').upload(fileName, file);

      if (error) {
          alert('Erro no upload: ' + error.message);
          return;
      }

      const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(fileName);

      const { error: updateError } = await supabase.from('tickets').update({
          attachment_name: file.name,
          attachment_url: publicUrl
      }).eq('id', ticketId);

      if(!updateError) {
           await supabase.from('ticket_history').insert({
              ticket_id: ticketId,
              status: selectedTicket?.currentStatus || TicketStatus.RECEBIDO,
              note: `Anexo atualizado: ${file.name}`,
              updated_by: user.name
          });
          await fetchTickets();
           if (selectedTicket) setSelectedTicket({...selectedTicket, attachmentName: file.name, attachmentUrl: publicUrl});
      }
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // --- Sidebar Content ---
  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800 bg-slate-950">
           <Radio className="h-8 w-8 text-blue-500 animate-pulse" />
           <div>
               <h1 className="text-lg font-bold tracking-tight text-white">TelcoFlow</h1>
               <p className="text-xs text-slate-400">Manager Pro v2.0</p>
           </div>
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
      
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md z-30 sticky top-0">
           <div className="flex items-center space-x-2">
              <Radio className="h-6 w-6 text-blue-500" />
              <span className="font-bold">TelcoFlow</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 rounded hover:bg-slate-800">
              <Menu className="h-6 w-6" />
           </button>
        </header>

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

            {loading && currentView !== 'dashboard' && <div className="text-center py-4 text-blue-600 font-medium">Carregando dados...</div>}

            {currentView === 'dashboard' && <Dashboard tickets={tickets} isLoading={loading} />}
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