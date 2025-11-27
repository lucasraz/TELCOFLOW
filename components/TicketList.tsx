import React, { useState, useRef } from 'react';
import { Ticket, TicketStatus, TicketType } from '../types';
import { Button } from './Button';
import { Download, Filter, Eye, Search, Trash2, AlertTriangle, Upload, FileSpreadsheet, MapPin, Calendar, User } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  onViewDetail: (ticket: Ticket) => void;
  onDelete: (ticketId: string) => void;
  onImport?: (tickets: Ticket[]) => void;
}

export const TicketList: React.FC<TicketListProps> = ({ tickets, onViewDetail, onDelete, onImport }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTickets = tickets.filter(ticket => {
    const matchesType = filterType === 'all' || ticket.type === filterType;
    const matchesStatus = filterStatus === 'all' || ticket.currentStatus === filterStatus;
    
    // Busca: ID, ARD, Cidade OU ID Anterior (Substituto)
    const term = searchTerm.toLowerCase();
    const matchesSearch = ticket.ardName.toLowerCase().includes(term) || 
                          ticket.city.toLowerCase().includes(term) ||
                          ticket.id.toLowerCase().includes(term) ||
                          (ticket.previousTicketId && ticket.previousTicketId.toLowerCase().includes(term));

    return matchesType && matchesStatus && matchesSearch;
  });

  const handleExport = () => {
    const headers = ["ID", "ID Anterior", "ARD", "Coordenadas", "UF", "Cidade", "Solicitante", "Tipo", "Cliente", "Valor", "Status", "Data Entrada", "Data Criação"];
    const rows = filteredTickets.map(t => [
      t.id,
      t.previousTicketId || '-',
      t.ardName,
      t.coordinates || '-',
      t.uf,
      t.city,
      t.requester,
      t.type,
      t.client || '-',
      t.value.toString().replace('.', ','),
      t.currentStatus,
      new Date(t.entryDate).toLocaleDateString(),
      new Date(t.createdAt).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `telecom_flow_export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
      const headers = ["ID", "ARD", "Coordenadas", "UF", "Cidade", "Solicitante", "Tipo (B2B ou Desligue Cobre)", "Cliente", "DataEntrada (AAAA-MM-DD)", "ID_Substituto (Se houver)"];
      const example = ["TC-EXEMPLO-01", "ARD Centro", "-23.55,-46.63", "SP", "São Paulo", "João Silva", "B2B", "Empresa X", "2023-10-25", ""];
      
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(';'), example.join(';')].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `modelo_importacao_tickets.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          const text = evt.target?.result as string;
          if (!text) return;

          const lines = text.split('\n');
          // Remove headers
          const dataLines = lines.slice(1).filter(line => line.trim() !== '');
          
          const newTickets: Ticket[] = [];
          
          dataLines.forEach(line => {
              const cols = line.split(';'); // Assumindo separador ;
              if (cols.length < 5) return; // Validação básica

              const id = cols[0]?.trim();
              const ardName = cols[1]?.trim();
              const coordinates = cols[2]?.trim();
              const uf = cols[3]?.trim();
              const city = cols[4]?.trim();
              const requester = cols[5]?.trim();
              const typeStr = cols[6]?.trim();
              const client = cols[7]?.trim();
              const entryDate = cols[8]?.trim() || new Date().toISOString().split('T')[0];
              const previousTicketId = cols[9]?.trim();

              const type = typeStr?.toUpperCase() === 'DESLIGUE COBRE' ? TicketType.DESLIGUE_COBRE : TicketType.B2B;

              if(id && ardName) {
                  newTickets.push({
                      id,
                      ardName,
                      coordinates,
                      uf: uf || 'SP',
                      city: city || 'Desconhecida',
                      requester: requester || 'Sistema',
                      type,
                      client: type === TicketType.B2B ? client : undefined,
                      value: 0,
                      currentStatus: TicketStatus.RECEBIDO,
                      createdAt: new Date().toISOString(),
                      entryDate: entryDate,
                      isSubstitute: !!previousTicketId,
                      previousTicketId,
                      history: [{
                          date: new Date().toISOString(),
                          status: TicketStatus.RECEBIDO,
                          note: 'Importado via planilha (Carga em massa)',
                          updatedBy: 'Sistema'
                      }]
                  });
              }
          });

          if (onImport && newTickets.length > 0) {
              onImport(newTickets);
              alert(`${newTickets.length} tickets importados com sucesso!`);
          } else {
              alert("Nenhum ticket válido encontrado ou erro na formatação.");
          }
          
          if(fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  const isSlaBreached = (ticket: Ticket) => {
    if (ticket.currentStatus === TicketStatus.APROVADO || ticket.currentStatus === TicketStatus.CANCELADO || ticket.currentStatus === TicketStatus.DEVOLVIDO) return false;
    if (ticket.history.length === 0) return false;
    const lastUpdateDate = new Date(ticket.history[ticket.history.length - 1].date).getTime();
    const now = new Date().getTime();
    const hoursDiff = (now - lastUpdateDate) / (1000 * 60 * 60);
    return hoursDiff > 48;
  };

  const getStatusBadge = (status: TicketStatus) => {
      const styles = {
          [TicketStatus.APROVADO]: 'bg-green-100 text-green-800 border-green-200',
          [TicketStatus.CANCELADO]: 'bg-red-100 text-red-800 border-red-200',
          [TicketStatus.DEVOLVIDO]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          [TicketStatus.NA_FILA]: 'bg-blue-100 text-blue-800 border-blue-200',
          [TicketStatus.RECEBIDO]: 'bg-slate-100 text-slate-800 border-slate-200',
          [TicketStatus.PENDENCIA_CLIENTE]: 'bg-amber-100 text-amber-800 border-amber-200',
          [TicketStatus.PENDENCIA_EMPREITEIRA]: 'bg-purple-100 text-purple-800 border-purple-200'
      };
      const style = styles[status] || styles[TicketStatus.RECEBIDO];
      return (
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${style}`}>
            {status}
        </span>
      );
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden flex flex-col h-full">
      {/* Filters Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input 
                type="text"
                placeholder="Buscar por ID, ARD ou Cidade..."
                className="pl-10 block w-full rounded-md border-slate-300 border p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2">
            <select 
                className="w-full sm:w-auto rounded-md border-slate-300 border p-2 text-sm"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
            >
                <option value="all">Todos Tipos</option>
                {Object.values(TicketType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            
            <select 
                className="w-full sm:w-auto rounded-md border-slate-300 border p-2 text-sm"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
            >
                <option value="all">Todos Status</option>
                {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="hidden xl:block h-6 w-px bg-slate-300 mx-1"></div>

            {/* Actions Toolbar - Wrap on mobile */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} title="Baixar Modelo" className="flex-1 sm:flex-none">
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Modelo</span>
                </Button>

                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} title="Importar" className="flex-1 sm:flex-none">
                    <Upload className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Importar</span>
                </Button>

                <Button variant="primary" size="sm" onClick={handleExport} title="Exportar" className="flex-1 sm:flex-none">
                    <Download className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Exportar</span>
                </Button>
            </div>
        </div>
      </div>

      {/* MOBILE: Card View (Visible on small screens) */}
      <div className="block md:hidden bg-slate-50 p-2 space-y-3">
          {filteredTickets.map(ticket => {
              const slaBreached = isSlaBreached(ticket);
              return (
                  <div key={ticket.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                      <div className="flex justify-between items-start mb-2">
                          <div>
                              <div className="flex items-center space-x-2">
                                  <span className="font-bold text-blue-600">{ticket.id}</span>
                                  {ticket.isSubstitute && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded">SUB</span>}
                              </div>
                              <div className="text-xs text-slate-500">{new Date(ticket.entryDate).toLocaleDateString()}</div>
                          </div>
                          {getStatusBadge(ticket.currentStatus)}
                      </div>
                      
                      <div className="space-y-1 mb-3">
                          <div className="flex items-center text-sm text-slate-800 font-medium">
                              <MapPin className="h-3 w-3 mr-1 text-slate-400" /> {ticket.ardName}
                          </div>
                          <div className="text-xs text-slate-500 pl-4">{ticket.city} - {ticket.uf}</div>
                          <div className="flex items-center text-xs text-slate-600 pl-4 mt-1">
                              <User className="h-3 w-3 mr-1" /> {ticket.requester}
                          </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                          <div className="text-sm font-bold text-slate-900">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticket.value)}
                          </div>
                          <div className="flex space-x-2">
                              {slaBreached && <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" title="SLA Estourado" />}
                              <button onClick={() => onViewDetail(ticket)} className="p-2 text-blue-600 bg-blue-50 rounded-full">
                                  <Eye className="h-4 w-4" />
                              </button>
                          </div>
                      </div>
                  </div>
              );
          })}
          {filteredTickets.length === 0 && <div className="text-center py-8 text-slate-500">Nenhum registro.</div>}
      </div>

      {/* DESKTOP: Table View (Hidden on small screens) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID / Data</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Local</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Info</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo / Valor</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredTickets.map((ticket) => {
                const slaBreached = isSlaBreached(ticket);
                return (
              <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                      <div className="text-sm font-bold text-blue-600">{ticket.id}</div>
                      {ticket.isSubstitute && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] rounded border border-yellow-200">SUB</span>}
                  </div>
                  {ticket.isSubstitute && ticket.previousTicketId && (
                      <div className="text-[10px] text-slate-400">Ref: {ticket.previousTicketId}</div>
                  )}
                  <div className="text-xs text-slate-500 mt-1">{new Date(ticket.entryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
                  {slaBreached && (
                      <div className="flex items-center text-red-500 text-xs mt-1 font-semibold animate-pulse">
                          <AlertTriangle className="h-3 w-3 mr-1" /> SLA {'>'} 48h
                      </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900 font-medium">{ticket.ardName}</div>
                  <div className="text-xs text-slate-500">{ticket.city} - {ticket.uf}</div>
                  {ticket.coordinates && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{ticket.coordinates}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <div>{ticket.requester}</div>
                  {ticket.client && <div className="text-xs text-slate-400 font-medium">{ticket.client}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.type === TicketType.B2B ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>
                    {ticket.type}
                  </span>
                  <div className="text-sm text-slate-900 mt-1 font-mono">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticket.value)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap relative">
                   <div className="flex items-center">
                       {/* LED indicator */}
                       {(ticket.currentStatus === TicketStatus.APROVADO || ticket.currentStatus === TicketStatus.CANCELADO) && (
                           <span className="relative flex h-3 w-3 mr-2">
                             <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${ticket.currentStatus === TicketStatus.APROVADO ? 'bg-green-400' : 'bg-red-400'}`}></span>
                             <span className={`relative inline-flex rounded-full h-3 w-3 ${ticket.currentStatus === TicketStatus.APROVADO ? 'bg-green-500' : 'bg-red-500'}`}></span>
                           </span>
                       )}
                       {getStatusBadge(ticket.currentStatus)}
                   </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    <button onClick={() => onViewDetail(ticket)} className="text-blue-600 hover:text-blue-900 flex items-center" title="Ver Detalhes">
                        <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => {
                        if(window.confirm(`Tem certeza que deseja deletar o ticket ${ticket.id}?`)) {
                            onDelete(ticket.id);
                        }
                    }} className="text-red-400 hover:text-red-700 flex items-center" title="Deletar">
                        <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
            {filteredTickets.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">Nenhum registro encontrado.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};