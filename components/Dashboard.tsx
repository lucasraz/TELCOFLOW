import React, { useMemo, useState, useEffect } from 'react';
import { Ticket, TicketType, TicketStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { DollarSign, FileText, Clock, AlertOctagon, Filter } from 'lucide-react';

interface DashboardProps {
  tickets: Ticket[];
  isLoading?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ tickets, isLoading = false }) => {
  const [dateRange, setDateRange] = useState<'all' | '30days' | '7days'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showContent, setShowContent] = useState(false);

  // Effect to trigger entry animations
  useEffect(() => {
    if (!isLoading) {
      setShowContent(true);
    }
  }, [isLoading]);

  const filteredTickets = useMemo(() => {
    let result = tickets;

    // Filter by Date
    if (dateRange !== 'all') {
        const now = new Date();
        const days = dateRange === '30days' ? 30 : 7;
        const cutoff = new Date(now.setDate(now.getDate() - days));
        result = result.filter(t => new Date(t.entryDate) >= cutoff);
    }

    // Filter by Type
    if (filterType !== 'all') {
        result = result.filter(t => t.type === filterType);
    }

    // Filter by Status
    if (filterStatus !== 'all') {
        result = result.filter(t => t.currentStatus === filterStatus);
    }

    return result;
  }, [tickets, dateRange, filterType, filterStatus]);

  const stats = useMemo(() => {
    const approvedValue = filteredTickets
      .filter(t => t.currentStatus === TicketStatus.APROVADO)
      .reduce((acc, t) => acc + t.value, 0);

    const cancelledValue = filteredTickets
      .filter(t => t.currentStatus === TicketStatus.CANCELADO)
      .reduce((acc, t) => acc + t.value, 0);
    
    const pendingValue = filteredTickets
      .filter(t => t.currentStatus !== TicketStatus.APROVADO && t.currentStatus !== TicketStatus.CANCELADO)
      .reduce((acc, t) => acc + t.value, 0);

    const totalTickets = filteredTickets.length;
    const approvedCount = filteredTickets.filter(t => t.currentStatus === TicketStatus.APROVADO).length;
    const pendingCount = filteredTickets.filter(t => t.currentStatus !== TicketStatus.APROVADO && t.currentStatus !== TicketStatus.CANCELADO).length;

    const typeData = [
      { name: 'B2B', value: filteredTickets.filter(t => t.type === TicketType.B2B).length },
      { name: 'Desligue Cobre', value: filteredTickets.filter(t => t.type === TicketType.DESLIGUE_COBRE).length },
    ];

    const statusData = Object.values(TicketStatus).map(status => ({
      name: status,
      quantidade: filteredTickets.filter(t => t.currentStatus === status).length,
      valor: filteredTickets.filter(t => t.currentStatus === status).reduce((acc, t) => acc + t.value, 0)
    }));

    return { approvedValue, pendingValue, cancelledValue, totalTickets, approvedCount, pendingCount, typeData, statusData };
  }, [filteredTickets]);

  const PIE_COLORS = ['#2563EB', '#F59E0B'];
  const STATUS_COLORS = {
    [TicketStatus.APROVADO]: '#10B981',
    [TicketStatus.CANCELADO]: '#EF4444',
    [TicketStatus.RECEBIDO]: '#64748B',
    [TicketStatus.NA_FILA]: '#3B82F6',
    [TicketStatus.PENDENCIA_CLIENTE]: '#F59E0B',
    [TicketStatus.PENDENCIA_EMPREITEIRA]: '#8B5CF6',
    [TicketStatus.DEVOLVIDO]: '#6366F1' 
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // --- SKELETON COMPONENT ---
  const SkeletonCard = () => (
    <div className="bg-white overflow-hidden shadow rounded-lg p-4 md:p-5 animate-pulse border border-slate-100">
      <div className="flex items-center">
        <div className="rounded-full bg-slate-200 h-10 w-10"></div>
        <div className="ml-3 w-0 flex-1 space-y-2">
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
          <div className="h-5 bg-slate-200 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );

  const SkeletonChart = () => (
    <div className="bg-white shadow rounded-lg p-4 md:p-6 animate-pulse border border-slate-100 h-full">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
      <div className="h-64 bg-slate-100 rounded w-full flex items-end justify-between p-4 space-x-2">
          {[...Array(6)].map((_, i) => (
             <div key={i} className="bg-slate-200 w-full rounded-t" style={{height: `${Math.random() * 80 + 20}%`}}></div>
          ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20">
         <div className="flex justify-end mb-4">
             <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
            <div className="lg:col-span-2">
                <SkeletonChart />
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 pb-20 transition-opacity duration-700 ease-in-out ${showContent ? 'opacity-100' : 'opacity-0'}`}>
      {/* Filtros */}
      <div className="flex flex-wrap justify-end mb-4 gap-2">
        <div className="bg-white rounded-lg shadow-sm p-1 flex items-center space-x-1 border border-slate-200 transition-shadow hover:shadow-md">
           <Filter className="h-4 w-4 text-slate-500 ml-2 mr-1" />
           <select 
             className="bg-transparent border-none text-sm focus:ring-0 text-slate-700 py-1 cursor-pointer"
             value={dateRange}
             onChange={(e) => setDateRange(e.target.value as any)}
           >
             <option value="all">Todo o Período</option>
             <option value="30days">Últimos 30 dias</option>
             <option value="7days">Últimos 7 dias</option>
           </select>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-1 flex items-center space-x-1 border border-slate-200 transition-shadow hover:shadow-md">
           <Filter className="h-4 w-4 text-slate-500 ml-2 mr-1" />
           <select 
             className="bg-transparent border-none text-sm focus:ring-0 text-slate-700 py-1 cursor-pointer"
             value={filterType}
             onChange={(e) => setFilterType(e.target.value)}
           >
             <option value="all">Todos os Tipos</option>
             {Object.values(TicketType).map(t => <option key={t} value={t}>{t}</option>)}
           </select>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-1 flex items-center space-x-1 border border-slate-200 transition-shadow hover:shadow-md">
           <Filter className="h-4 w-4 text-slate-500 ml-2 mr-1" />
           <select 
             className="bg-transparent border-none text-sm focus:ring-0 text-slate-700 py-1 cursor-pointer"
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
           >
             <option value="all">Todos os Status</option>
             {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-5">
        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500 p-4 md:p-5 transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-green-50 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-slate-500 truncate uppercase">Aprovado</dt>
                  <dd className="text-lg font-bold text-slate-900">
                    {formatCurrency(stats.approvedValue)}
                  </dd>
                </dl>
              </div>
            </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-yellow-500 p-4 md:p-5 transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-yellow-50 rounded-full">
                   <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-slate-500 truncate uppercase">Pendente</dt>
                  <dd className="text-lg font-bold text-slate-900">
                    {formatCurrency(stats.pendingValue)}
                  </dd>
                </dl>
              </div>
            </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-red-500 p-4 md:p-5 transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-red-50 rounded-full">
                  <AlertOctagon className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-slate-500 truncate uppercase">Cancelado</dt>
                  <dd className="text-lg font-bold text-slate-900">
                    {formatCurrency(stats.cancelledValue)}
                  </dd>
                </dl>
              </div>
            </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-4 md:p-5 transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-2 bg-slate-50 rounded-full">
                  <FileText className="h-6 w-6 text-slate-400" />
                </div>
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-slate-500 truncate uppercase">Volume Total</dt>
                  <dd className="text-lg font-bold text-slate-900">{stats.totalTickets}</dd>
                </dl>
              </div>
            </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg p-4 md:p-5 transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg">
             <div className="flex items-center justify-between">
                <div className="text-center">
                    <span className="block text-xl md:text-2xl font-bold text-green-600">{stats.approvedCount}</span>
                    <span className="text-[10px] md:text-xs text-slate-500 uppercase">Aprovados</span>
                </div>
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="text-center">
                    <span className="block text-xl md:text-2xl font-bold text-yellow-600">{stats.pendingCount}</span>
                    <span className="text-[10px] md:text-xs text-slate-500 uppercase">Na Fila</span>
                </div>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Volume Financeiro por Status */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6 transition-all hover:shadow-md">
          <h3 className="text-base md:text-lg leading-6 font-medium text-slate-900 mb-4">Volume Financeiro por Status</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.statusData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.5} />
                <XAxis type="number" tickFormatter={(val) => `R$${val/1000}k`} hide />
                <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 9}} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar 
                  dataKey="valor" 
                  radius={[0, 4, 4, 0]} 
                  animationDuration={1500} 
                  animationEasing="ease-out"
                >
                    {stats.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as TicketStatus] || '#94a3b8'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Status (Quantidade) */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6 transition-all hover:shadow-md">
          <h3 className="text-base md:text-lg leading-6 font-medium text-slate-900 mb-4">Evolução por Status</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.statusData}>
                <defs>
                  <linearGradient id="colorQuantidade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                <XAxis dataKey="name" tick={{fontSize: 9}} angle={-15} textAnchor="end" height={50} />
                <YAxis />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area 
                  type="monotone" 
                  dataKey="quantidade" 
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#colorQuantidade)" 
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Pizza Tipo */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6 lg:col-span-2 transition-all hover:shadow-md">
           <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="w-full md:w-1/2 h-64">
                    <h3 className="text-base md:text-lg leading-6 font-medium text-slate-900 mb-4 text-center">Distribuição por Tipo</h3>
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                          data={stats.typeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          animationDuration={1500}
                          animationEasing="ease-out"
                          animationBegin={200}
                        >
                        {stats.typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                        ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 p-2 md:p-4 mt-4 md:mt-0">
                    <h4 className="font-bold text-slate-700 mb-2">Resumo da Carteira</h4>
                    <ul className="space-y-3">
                        <li className="flex justify-between items-center p-3 bg-slate-50 rounded hover:bg-slate-100 transition-colors">
                            <span className="text-sm text-slate-600">Total B2B</span>
                            <span className="font-bold text-slate-900 text-lg">{stats.typeData[0].value}</span>
                        </li>
                        <li className="flex justify-between items-center p-3 bg-slate-50 rounded hover:bg-slate-100 transition-colors">
                            <span className="text-sm text-slate-600">Total Desligue Cobre</span>
                            <span className="font-bold text-slate-900 text-lg">{stats.typeData[1].value}</span>
                        </li>
                        <li className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-100">
                            <span className="text-sm text-green-700">Taxa de Aprovação</span>
                            <span className="font-bold text-green-700 text-lg">
                                {stats.totalTickets > 0 ? ((stats.approvedCount / stats.totalTickets) * 100).toFixed(1) : 0}%
                            </span>
                        </li>
                    </ul>
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};