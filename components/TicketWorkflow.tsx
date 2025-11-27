import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus, User } from '../types';
import { Button } from './Button';
import { X, Clock, CheckCircle, AlertCircle, Trash2, ZoomIn, RefreshCw, Download, MapPin, DollarSign, TrendingDown, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface TicketWorkflowProps {
  ticket: Ticket;
  tickets: Ticket[]; 
  user: User;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, newStatus: TicketStatus, note: string) => Promise<void>;
  onUpdateAttachment: (ticketId: string, file: File) => Promise<void>;
  onUpdateValue: (ticketId: string, value: number) => Promise<void>;
  onDelete: (ticketId: string) => Promise<void>;
}

export const TicketWorkflow: React.FC<TicketWorkflowProps> = ({ ticket, tickets, user, onClose, onUpdateStatus, onUpdateAttachment, onUpdateValue, onDelete }) => {
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.currentStatus);
  const [note, setNote] = useState('');
  const [editValue, setEditValue] = useState<string>(ticket.value.toString());
  const [loading, setLoading] = useState(false);
  
  const [showImageModal, setShowImageModal] = useState(false);
  const [isReplacingAttachment, setIsReplacingAttachment] = useState(false);
  const [newAttachment, setNewAttachment] = useState<File | null>(null);

  const previousTicket = useMemo(() => {
      if (ticket.isSubstitute && ticket.previousTicketId) {
          return tickets.find(t => t.id === ticket.previousTicketId);
      }
      return null;
  }, [ticket, tickets]);

  const valueDifference = useMemo(() => {
      if (previousTicket) {
          return ticket.value - previousTicket.value;
      }
      return 0;
  }, [ticket.value, previousTicket]);

  const handleUpdate = async () => {
    if (note.trim()) {
      setLoading(true);
      await onUpdateStatus(ticket.id, newStatus, note);
      setLoading(false);
      setNote('');
    }
  };

  const handleValueBlur = async () => {
      const numVal = parseFloat(editValue);
      if(!isNaN(numVal) && numVal !== ticket.value) {
          setLoading(true);
          await onUpdateValue(ticket.id, numVal);
          setLoading(false);
      }
  }

  const handleAttachmentUpload = async () => {
      if(newAttachment) {
          setLoading(true);
          await onUpdateAttachment(ticket.id, newAttachment);
          setLoading(false);
          setIsReplacingAttachment(false);
          setNewAttachment(null);
      }
  }

  const handleDelete = async () => {
      if(window.confirm("Esta ação é irreversível. Deletar ticket?")) {
          setLoading(true);
          await onDelete(ticket.id);
          setLoading(false);
          onClose();
      }
  }

  const availableStatuses = Object.values(TicketStatus);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-end z-50 transition-opacity" onClick={onClose}>
      <div className="bg-white w-full md:w-[600px] h-full shadow-2xl overflow-y-auto flex flex-col animate-slide-in-right" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center flex-wrap gap-2">
                Fluxo de Trabalho
                {ticket.isSubstitute && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Substituto</span>}
            </h2>
            <p className="text-sm text-slate-500 font-mono">ID: {ticket.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          {/* Ticket Info Card */}
          <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200 shadow-sm">
             <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Local</span>
                    <p className="text-sm font-medium text-slate-900">{ticket.ardName}</p>
                    <p className="text-xs text-slate-600">{ticket.city} - {ticket.uf}</p>
                    {ticket.coordinates && (
                        <p className="text-xs text-slate-400 font-mono mt-1 flex items-center">
                            <MapPin className="h-3 w-3 mr-1"/> {ticket.coordinates}
                        </p>
                    )}
                </div>
                <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold">Tipo / Cliente</span>
                    <p className="text-sm font-medium text-slate-900">{ticket.type}</p>
                    {ticket.client && <p className="text-xs text-slate-500">{ticket.client}</p>}
                </div>
                <div className="col-span-2 md:col-span-1">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Anexo</span>
                    <div className="flex items-center space-x-2 mt-1">
                        {ticket.attachmentUrl ? (
                            <button 
                                className="text-xs flex items-center text-blue-600 hover:text-blue-800 underline bg-blue-50 px-2 py-1 rounded"
                                onClick={() => setShowImageModal(true)}
                            >
                                <ZoomIn className="h-3 w-3 mr-1" />
                                Visualizar
                            </button>
                        ) : (
                            <span className="text-xs text-slate-400 italic">Sem anexo</span>
                        )}
                        <button 
                            className="text-xs text-slate-500 hover:text-slate-700 bg-slate-200 p-1 rounded"
                            onClick={() => setIsReplacingAttachment(!isReplacingAttachment)}
                            title="Trocar Anexo"
                        >
                            <RefreshCw className="h-3 w-3" />
                        </button>
                    </div>
                </div>
                
                {/* Comparativo de Valor */}
                {ticket.isSubstitute && previousTicket && (
                     <div className="col-span-2 border-t border-slate-200 pt-2 mt-2 bg-white p-2 rounded border-dashed">
                        <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">Comparativo</span>
                        <div className="flex items-center justify-between text-sm">
                            <div className="text-slate-500">
                                <span className="block text-xs">Anterior</span>
                                {formatCurrency(previousTicket.value)}
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-300" />
                            <div className="text-slate-900 font-bold">
                                <span className="block text-xs font-normal text-slate-500">Atual</span>
                                {formatCurrency(ticket.value)}
                            </div>
                            <div className={`text-right ${valueDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                <span className="block text-xs text-slate-500">Dif.</span>
                                <div className="flex items-center justify-end">
                                    {valueDifference > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                    {formatCurrency(valueDifference)}
                                </div>
                            </div>
                        </div>
                     </div>
                )}
             </div>

             {/* Substituição de Anexo */}
             {isReplacingAttachment && (
                 <div className="mt-4 p-3 bg-white rounded border border-blue-100 animate-fade-in">
                     <label className="block text-xs font-medium text-slate-700 mb-1">Novo Arquivo</label>
                     <input type="file" className="block w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" onChange={e => setNewAttachment(e.target.files ? e.target.files[0] : null)} />
                     <div className="mt-2 flex justify-end">
                         <Button size="sm" onClick={handleAttachmentUpload} disabled={!newAttachment} isLoading={loading}>Confirmar Troca</Button>
                     </div>
                 </div>
             )}
          </div>

          {/* Timeline */}
          <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-slate-500" />
              Histórico
          </h3>
          <div className="flow-root mb-8">
            <ul className="-mb-8">
              {ticket.history.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((event, eventIdx) => (
                <li key={eventIdx}>
                  <div className="relative pb-8">
                    {eventIdx !== ticket.history.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white 
                             ${event.status === TicketStatus.APROVADO ? 'bg-green-500' : 
                               event.status === TicketStatus.CANCELADO ? 'bg-red-500' : 
                               event.status === TicketStatus.NA_FILA ? 'bg-blue-500' : 'bg-slate-400'}`}>
                          {event.status === TicketStatus.APROVADO ? <CheckCircle className="h-5 w-5 text-white" /> : 
                           event.status === TicketStatus.CANCELADO ? <AlertCircle className="h-5 w-5 text-white" /> : 
                           <Clock className="h-5 w-5 text-white" />}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5">
                          <div className="flex justify-between text-sm mb-1">
                             <span className="font-bold text-slate-800">{event.status}</span>
                             <span className="text-slate-500 text-xs">{new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">{event.note}</p>
                          <div className="text-xs text-slate-400 mt-1 text-right">Por: {event.updatedBy}</div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Map Section */}
          {ticket.coordinates && (
              <div className="mt-6 border-t border-slate-200 pt-6">
                 <h4 className="text-sm font-medium text-slate-900 mb-3 flex items-center">
                     <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                     Localização (Zoom 18)
                 </h4>
                 <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm h-48 w-full bg-slate-100 relative">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={`https://maps.google.com/maps?q=${ticket.coordinates}&hl=pt-br&z=18&output=embed`}
                        title="Localização do Ticket"
                        className="absolute inset-0"
                    ></iframe>
                 </div>
              </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 md:p-6 border-t border-slate-200 bg-slate-50 sticky bottom-0 z-20">
          <h4 className="text-sm font-medium text-slate-900 mb-3">Atualizar Esteira</h4>
          
          <div className="mb-4 bg-white p-3 rounded border border-slate-200">
               <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center">
                   <DollarSign className="h-3 w-3 mr-1" />
                   Valor do Projeto (R$)
               </label>
               <input 
                  type="number"
                  step="0.01"
                  className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-2 border"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={handleValueBlur}
                  inputMode="decimal"
                  disabled={loading}
               />
          </div>

          <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Novo Status</label>
                <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                    className="block w-full rounded-md border-slate-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-white"
                    disabled={loading}
                >
                    {availableStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Observação</label>
                <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="block w-full rounded-md border-slate-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    placeholder="Descreva a ação..."
                    disabled={loading}
                ></textarea>
            </div>
            <div className="flex gap-3">
                <Button className="flex-1 py-3" onClick={handleUpdate} disabled={!note.trim()} isLoading={loading}>
                    Salvar
                </Button>
                <Button variant="danger" className="w-14" onClick={handleDelete} title="Deletar" isLoading={loading}>
                    <Trash2 className="h-5 w-5" />
                </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-90 p-2 md:p-4" onClick={() => setShowImageModal(false)}>
              <div className="relative w-full max-w-4xl h-full flex flex-col justify-center" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowImageModal(false)} className="absolute top-4 right-4 z-10 text-white bg-black/50 rounded-full p-2">
                      <X className="h-6 w-6" />
                  </button>
                  <div className="bg-white rounded overflow-hidden flex flex-col items-center max-h-[90vh]">
                    <div className="w-full bg-gray-100 p-2 flex justify-end border-b">
                        <a href={ticket.attachmentUrl || '#'} download={`evidence-${ticket.id}`} className="text-blue-600 hover:text-blue-800 flex items-center text-sm px-3 py-2 bg-white rounded shadow-sm">
                            <Download className="h-4 w-4 mr-1" /> Baixar Imagem
                        </a>
                    </div>
                    <div className="flex-1 overflow-auto p-2 w-full flex justify-center bg-black">
                        <img 
                            src={ticket.attachmentUrl || ""} 
                            alt="Evidência" 
                            className="max-w-full object-contain" 
                        />
                    </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
