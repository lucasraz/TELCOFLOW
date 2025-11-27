import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus, User, TicketType } from '../types';
import { Button } from './Button';
import { X, Clock, CheckCircle, AlertCircle, Trash2, ZoomIn, RefreshCw, Download, MapPin, DollarSign, TrendingDown, TrendingUp, ExternalLink, FileText, Image as ImageIcon, Pencil } from 'lucide-react';
import { STATES_BR } from '../constants';

interface TicketWorkflowProps {
  ticket: Ticket;
  tickets: Ticket[]; 
  user: User;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, newStatus: TicketStatus, note: string) => Promise<void>;
  onUpdateAttachment: (ticketId: string, file: File) => Promise<void>;
  onUpdateValue: (ticketId: string, value: number) => Promise<void>;
  onDelete: (ticketId: string) => Promise<void>;
  onEditTicket: (ticketId: string, updatedData: Partial<Ticket>) => Promise<void>;
}

export const TicketWorkflow: React.FC<TicketWorkflowProps> = ({ ticket, tickets, user, onClose, onUpdateStatus, onUpdateAttachment, onUpdateValue, onDelete, onEditTicket }) => {
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.currentStatus);
  const [note, setNote] = useState('');
  const [editValue, setEditValue] = useState<string>(ticket.value.toString());
  const [loading, setLoading] = useState(false);
  
  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [isReplacingAttachment, setIsReplacingAttachment] = useState(false);
  const [newAttachment, setNewAttachment] = useState<File | null>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
      ardName: ticket.ardName,
      coordinates: ticket.coordinates || '',
      uf: ticket.uf,
      city: ticket.city,
      requester: ticket.requester,
      type: ticket.type,
      client: ticket.client || '',
      entryDate: ticket.entryDate,
      isSubstitute: ticket.isSubstitute,
      previousTicketId: ticket.previousTicketId || ''
  });

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
    setLoading(true);
    await onUpdateStatus(ticket.id, newStatus, note);
    setLoading(false);
    setNote('');
  };

  const handleSaveEdit = async () => {
      setLoading(true);
      await onEditTicket(ticket.id, {
          ...editForm,
          // Se for Desligue Cobre, limpa o cliente
          client: editForm.type === TicketType.DESLIGUE_COBRE ? undefined : editForm.client,
          // Se não for substituto, limpa o ID anterior
          previousTicketId: editForm.isSubstitute ? editForm.previousTicketId : undefined
      });
      setIsEditing(false);
      setLoading(false);
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
      if(window.confirm("ATENÇÃO: Esta ação é irreversível e excluirá todo o histórico. Deseja continuar?")) {
          setLoading(true);
          await onDelete(ticket.id);
          // O componente será desmontado pelo pai ao atualizar a lista
      }
  }

  const isImageFile = (filename?: string) => {
      if (!filename) return false;
      return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filename);
  };

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
                {ticket.isSubstitute && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-300">Substituto</span>}
            </h2>
            <p className="text-sm text-slate-500 font-mono">ID: {ticket.id}</p>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                >
                    <Pencil className="h-3 w-3" />
                    <span>Editar Dados</span>
                </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-200">
                <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6 flex-1 overflow-y-auto">
          
          {/* Ticket Info Card OR Edit Form */}
          {isEditing ? (
             <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200 shadow-inner">
                 <div className="flex justify-between items-center mb-4 pb-2 border-b border-blue-200">
                     <h3 className="font-bold text-blue-800">Editando Dados</h3>
                     <div className="flex space-x-2">
                         <button onClick={() => setIsEditing(false)} className="text-xs text-slate-500 hover:text-slate-700 underline">Cancelar</button>
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                     <div className="col-span-2">
                         <label className="block text-xs font-medium text-slate-700">Nome ARD / Local</label>
                         <input 
                            type="text" 
                            className="w-full text-xs border-slate-300 rounded p-1.5 focus:ring-blue-500"
                            value={editForm.ardName}
                            onChange={e => setEditForm({...editForm, ardName: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-medium text-slate-700">Cidade</label>
                         <input 
                            type="text" 
                            className="w-full text-xs border-slate-300 rounded p-1.5 focus:ring-blue-500"
                            value={editForm.city}
                            onChange={e => setEditForm({...editForm, city: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-medium text-slate-700">UF</label>
                         <select 
                            className="w-full text-xs border-slate-300 rounded p-1.5 focus:ring-blue-500"
                            value={editForm.uf}
                            onChange={e => setEditForm({...editForm, uf: e.target.value})}
                         >
                            {STATES_BR.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                     </div>
                     <div className="col-span-2">
                         <label className="block text-xs font-medium text-slate-700">Coordenadas</label>
                         <input 
                            type="text" 
                            className="w-full text-xs border-slate-300 rounded p-1.5 focus:ring-blue-500 font-mono"
                            value={editForm.coordinates}
                            onChange={e => setEditForm({...editForm, coordinates: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-medium text-slate-700">Tipo</label>
                         <select 
                            className="w-full text-xs border-slate-300 rounded p-1.5 focus:ring-blue-500"
                            value={editForm.type}
                            onChange={e => setEditForm({...editForm, type: e.target.value as TicketType})}
                         >
                            {Object.values(TicketType).map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                     </div>
                     <div>
                         <label className="block text-xs font-medium text-slate-700">Cliente (Se B2B)</label>
                         <input 
                            type="text" 
                            disabled={editForm.type !== TicketType.B2B}
                            className={`w-full text-xs border-slate-300 rounded p-1.5 focus:ring-blue-500 ${editForm.type !== TicketType.B2B ? 'bg-slate-200' : ''}`}
                            value={editForm.client}
                            onChange={e => setEditForm({...editForm, client: e.target.value})}
                         />
                     </div>
                     <div className="col-span-2">
                         <label className="block text-xs font-medium text-slate-700">Solicitante</label>
                         <input 
                            type="text" 
                            className="w-full text-xs border-slate-300 rounded p-1.5 focus:ring-blue-500"
                            value={editForm.requester}
                            onChange={e => setEditForm({...editForm, requester: e.target.value})}
                         />
                     </div>
                     <div>
                         <label className="block text-xs font-medium text-slate-700">Data Entrada</label>
                         <input 
                            type="date" 
                            className="w-full text-xs border-slate-300 rounded p-1.5 focus:ring-blue-500"
                            value={editForm.entryDate}
                            onChange={e => setEditForm({...editForm, entryDate: e.target.value})}
                         />
                     </div>
                     
                     <div className="col-span-2 mt-2 pt-2 border-t border-blue-200">
                         <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 mb-2">
                             <input 
                                type="checkbox" 
                                checked={editForm.isSubstitute}
                                onChange={e => setEditForm({...editForm, isSubstitute: e.target.checked})}
                                className="rounded text-blue-600 focus:ring-blue-500"
                             />
                             <span>É Substituto?</span>
                         </label>
                         {editForm.isSubstitute && (
                             <input 
                                type="text"
                                placeholder="ID do Ticket Anterior"
                                className="w-full text-xs border-slate-300 rounded p-1.5 focus:ring-blue-500"
                                value={editForm.previousTicketId}
                                onChange={e => setEditForm({...editForm, previousTicketId: e.target.value})}
                             />
                         )}
                     </div>

                     <div className="col-span-2 mt-2 flex justify-end space-x-2">
                         <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                         <Button size="sm" onClick={handleSaveEdit} isLoading={loading}>Salvar Alterações</Button>
                     </div>
                 </div>
             </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-200 shadow-sm animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 md:col-span-1">
                        <span className="text-xs text-slate-500 uppercase font-semibold">Local</span>
                        <p className="text-sm font-medium text-slate-900">{ticket.ardName}</p>
                        <p className="text-xs text-slate-600">{ticket.city} - {ticket.uf}</p>
                        {ticket.coordinates && (
                            <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.coordinates)}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline mt-1 flex items-center"
                            >
                                <MapPin className="h-3 w-3 mr-1"/> {ticket.coordinates}
                            </a>
                        )}
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 uppercase font-semibold">Tipo / Cliente</span>
                        <p className="text-sm font-medium text-slate-900">{ticket.type}</p>
                        {ticket.client && <p className="text-xs text-slate-500">{ticket.client}</p>}
                        <span className="text-xs text-slate-500 uppercase font-semibold block mt-2">Solicitante</span>
                        <p className="text-xs text-slate-900">{ticket.requester}</p>
                    </div>
                    
                    {/* Visualização do Anexo com Thumbnail */}
                    <div className="col-span-2 md:col-span-1">
                        <span className="text-xs text-slate-500 uppercase font-semibold block mb-2">Evidência (E-mail)</span>
                        
                        <div className="flex flex-col items-start space-y-2">
                            {ticket.attachmentUrl ? (
                                <div 
                                    className="group relative w-32 h-32 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all"
                                    onClick={() => setShowImageModal(true)}
                                    title={ticket.attachmentName}
                                >
                                    {isImageFile(ticket.attachmentName) ? (
                                        <img 
                                            src={ticket.attachmentUrl} 
                                            alt="Thumbnail" 
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500">
                                            <FileText className="h-8 w-8 mb-1" />
                                            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 truncate w-full text-center">
                                                {ticket.attachmentName?.split('.').pop() || 'FILE'}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {/* Overlay hover */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ZoomIn className="text-white h-6 w-6 drop-shadow-md" />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-32 h-32 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                                    <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
                                    <span className="text-[10px] italic">Sem anexo</span>
                                </div>
                            )}

                            <button 
                                className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded flex items-center transition-colors"
                                onClick={() => setIsReplacingAttachment(!isReplacingAttachment)}
                            >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                {ticket.attachmentUrl ? 'Trocar Arquivo' : 'Adicionar Arquivo'}
                            </button>
                        </div>
                    </div>
                    
                    {/* Comparativo de Valor / Detalhe do Ticket Anterior */}
                    {ticket.isSubstitute && (
                        <div className="col-span-2 border-t border-slate-200 pt-2 mt-2 bg-white p-3 rounded border border-yellow-100 shadow-sm">
                            <span className="text-xs text-slate-500 uppercase font-semibold block mb-2 border-b border-slate-100 pb-1">Ticket Substituído (Anterior)</span>
                            
                            {previousTicket ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">ID:</span>
                                        <span className="font-bold text-slate-900">{previousTicket.id}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Status Final:</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold 
                                            ${previousTicket.currentStatus === TicketStatus.APROVADO ? 'bg-green-100 text-green-800' : 
                                            previousTicket.currentStatus === TicketStatus.CANCELADO ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'}`}>
                                            {previousTicket.currentStatus}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Valor Anterior:</span>
                                        <span className="font-mono text-slate-700">{formatCurrency(previousTicket.value)}</span>
                                    </div>
                                    
                                    {/* Barra de Diferença */}
                                    <div className={`flex justify-between items-center text-sm pt-2 border-t border-slate-100 ${valueDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        <span className="text-xs text-slate-500">Diferença (Atual - Anterior):</span>
                                        <div className="flex items-center font-bold">
                                            {valueDifference > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                            {formatCurrency(valueDifference)}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-2 text-slate-400 text-xs italic">
                                    <AlertCircle className="h-4 w-4 mx-auto mb-1 text-yellow-400" />
                                    ID Anterior ({ticket.previousTicketId}) não encontrado no banco.
                                </div>
                            )}
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
          )}

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
                <Button className="flex-1 py-3" onClick={handleUpdate} isLoading={loading}>
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