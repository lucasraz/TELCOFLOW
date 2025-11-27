import React, { useState, useRef, useMemo } from 'react';
import { Ticket, TicketStatus, TicketType } from '../types';
import { Button } from './Button';
import { Download, Search, Trash2, AlertTriangle, Upload, FileSpreadsheet, MapPin, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  onViewDetail: (ticket: Ticket) => void;
  onDelete: (ticketId: string) => void;
  onImport?: (tickets: Ticket[]) => void;
}

type SortKey = 'id' | 'ardName' | 'value' | 'entryDate' | 'currentStatus' | 'requester';

export const TicketList: React.FC<TicketListProps> = ({ tickets, onViewDetail, onDelete, onImport }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSubstitute, setSearchSubstitute] = useState(false);
  
  // Date Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredTickets = useMemo(() => {
      let filtered = tickets.filter(ticket => {
        const matchesType = filterType === 'all' || ticket.type === filterType;
        const matchesStatus = filterStatus === 'all' || ticket.currentStatus === filterStatus;
        
        // Date Range
        const ticketDate = new Date(ticket.entryDate).getTime();
        const fromDate = dateFrom ? new Date(dateFrom).getTime() : 0;
        const toDate = dateTo ? new Date(dateTo).getTime() : Infinity;
        const matchesDate = ticketDate >= fromDate && ticketDate <= toDate;

        // Search Logic
        const term = searchTerm.toLowerCase();
        let matchesSearch = false;

        if (searchSubstitute) {
             // Se o toggle estiver ativo, busca EXCLUSIVAMENTE no ID Anterior (previousTicketId)
             matchesSearch = ticket.previousTicketId ? ticket.previousTicketId.toLowerCase().includes(term) : false;
        } else {
             // Busca Padrão: ID, ARD, Cidade
             matchesSearch = ticket.ardName.toLowerCase().includes(term) || 
                             ticket.city.toLowerCase().includes(term) ||
                             ticket.id.toLowerCase().includes(term);
        }

        return matchesType && matchesStatus && matchesSearch && matchesDate;
      });

      // Sorting
      if (sortConfig) {
          filtered.sort((a, b) => {
              let aValue: any = a[sortConfig.key];
              let bValue: any = b[sortConfig.key];

              if (sortConfig.key === 'value') {
                   // numeric sort
                   if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                   if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                   return 0;
              } else if (sortConfig.key === 'entryDate') {
                  // date sort
                  const dateA = new Date(aValue).getTime();
                  const dateB = new Date(bValue).getTime();
                  if (dateA < dateB) return sortConfig.direction === 'asc' ? -1 : 1;
                  if (dateA > dateB) return sortConfig.direction === 'asc' ? 1 : -1;
                  return 0;
              } else {
                  // string sort with numeric awareness (e.g. TC-2 before TC-10)
                  const strA = String(aValue || '').toLowerCase();
                  const strB = String(bValue || '').toLowerCase();
                  
                  return sortConfig.direction === 'asc' 
                    ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' })
                    : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: 'base' });
              }
          });
      }

      return filtered;
  }, [tickets, filterType, filterStatus, searchTerm, searchSubstitute, dateFrom, dateTo, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
      if (!sortConfig || sortConfig.key !== key) {
          return <ArrowUpDown className="h-3 w-3 ml-1 text-slate-300 opacity-50" />;
      }
      return sortConfig.direction === 'asc' ? 
          <ArrowUp className="h-3 w-3 ml-1 text-blue-600" /> : 
          <ArrowDown className="h-3 w-3 ml-1 text-blue-600" />;
  };

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
      <div className="p-4 border-b border-slate-200 flex flex-col gap-4">
        
        {/* Top Filter Row: Search & Toggles */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
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
            
            <label className={`flex items-center space-x-2 cursor-pointer px-3 py-2 rounded border w-full md:w-auto transition-all select-none ${searchSubstitute ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}>
                <input 
                    type="checkbox" 
                    checked={searchSubstitute} 
                    onChange={e => setSearchSubstitute(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className={`text-sm font-medium ${searchSubstitute ? 'text-blue-700' : 'text-slate-700'}`}>Buscar IDs Substitutos</span>
            </label>
        </div>
        
        {/* Bottom Filter Row: Dropdowns & Actions */}
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                <div className="flex items-center space-x-1 w-full sm:w-auto">
                    <span className="text-xs text-slate-500 whitespace-nowrap font-medium">De:</span>
                    <input 
                        type="date" 
                        className="rounded-md border-slate-300 border p-2 text-sm w-full" 
                        value={dateFrom} 
                        onChange={e => setDateFrom(e.target.value)} 
                    />
                </div>
                <div className="flex items-center space-x-1 w-full sm:w-auto">
                     <span className="text-xs text-slate-500 whitespace-nowrap font-medium">Até:</span>
                     <input 
                        type="date" 
                        className="rounded-md border-slate-300 border p-2 text-sm w-full" 
                        value={dateTo} 
                        onChange={e => setDateTo(e.target.value)} 
                     />
                </div>

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
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-center sm:justify-end">
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="flex-1 sm:flex-none">
                     <span className="flex items-center" title="Baixar Modelo">
                        <FileSpreadsheet className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Modelo</span>
                     </span>
                </Button>

                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-1 sm:flex-none">
                    <span className="flex items-center" title="Importar">
                        <Upload className="h-4 w-4 mr-2" /> <span className="hidden sm:inline">Importar</span>
                    </span>
                </Button>

                <Button variant="primary" size="sm" onClick={handleExport} className="flex-1 sm:flex-none">
                     <span className="flex items-center" title="Exportar">
                        <Download className="h-4 w-4 mr