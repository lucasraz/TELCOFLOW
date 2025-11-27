import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Calculator, Clock, StickyNote, Globe, Plus, Trash2, Bell, BellRing } from 'lucide-react';
import { Button } from './Button';
import { supabase } from '../supabaseClient';

// --- Widget Container (Accordion) ---
const WidgetSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-700 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-xs font-medium uppercase tracking-wider"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {isOpen && (
        <div className="p-3 bg-slate-800/50 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

// --- 1. Clock & Date Widget ---
const ClockWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center">
      <div className="text-2xl font-mono text-white font-bold tracking-widest">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-xs text-slate-400 mt-1 uppercase">
        {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
      </div>
    </div>
  );
};

// --- 2. Calculator Widget ---
const CalculatorWidget = () => {
  const [display, setDisplay] = useState('');

  const handleClick = (val: string) => {
    if (val === '=') {
      try {
        // eslint-disable-next-line no-eval
        setDisplay(eval(display).toString());
      } catch {
        setDisplay('Erro');
      }
    } else if (val === 'C') {
      setDisplay('');
    } else {
      setDisplay(prev => prev + val);
    }
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    'C', '0', '=', '+'
  ];

  return (
    <div className="select-none">
      <div className="bg-slate-900 p-2 rounded mb-2 text-right text-white font-mono h-8 overflow-hidden text-sm border border-slate-600">
        {display || '0'}
      </div>
      <div className="grid grid-cols-4 gap-1">
        {buttons.map(btn => (
          <button
            key={btn}
            onClick={() => handleClick(btn)}
            className={`p-1 rounded text-xs font-bold transition-colors ${
              btn === '=' ? 'bg-blue-600 text-white' : 
              btn === 'C' ? 'bg-red-500 text-white' : 
              ['/', '*', '-', '+'].includes(btn) ? 'bg-slate-600 text-white' : 
              'bg-slate-700 text-slate-200 hover:bg-slate-600'
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- 3. Reminder & Alarm Widget (Connected to DB) ---
type Reminder = {
  id: string;
  text: string;
  datetime: string; // ISO String
  notified: boolean;
};

const RemindersWidget = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newText, setNewText] = useState('');
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch from DB
  useEffect(() => {
    const fetchReminders = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if(!user) return;

        const { data, error } = await supabase
            .from('reminders')
            .select('*')
            .eq('user_id', user.id);
        
        if (data && !error) {
            setReminders(data);
        }
    };
    fetchReminders();
    
    // Request Permission
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Check Interval for Notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setReminders(prev => prev.map(r => {
        const reminderTime = new Date(r.datetime);
        if (!r.notified && reminderTime <= now) {
          // Trigger Notification
          if (Notification.permission === 'granted') {
            new Notification("Lembrete TelcoFlow", {
              body: r.text,
            });
          }
          // Update DB as notified (optional, skipping to save calls, just local state update for visual)
          return { ...r, notified: true };
        }
        return r;
      }));
    }, 10000); 

    return () => clearInterval(interval);
  }, []);

  const handleAdd = async () => {
    if (!newText || !newDate) return;
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data, error } = await supabase.from('reminders').insert({
            user_id: user.id,
            text: newText,
            datetime: newDate,
            notified: false
        }).select().single();

        if (data && !error) {
            setReminders(prev => [...prev, data]);
            setNewText('');
            setNewDate('');
        }
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (!error) {
        setReminders(reminders.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-3">
      {/* Input Area */}
      <div className="space-y-2">
        <input
          type="text"
          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:ring-blue-500"
          placeholder="Novo lembrete..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
        />
        <div className="flex space-x-1">
          <input
            type="datetime-local"
            className="flex-1 bg-slate-900 border border-slate-600 rounded px-1 py-1 text-[10px] text-white focus:ring-blue-500"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
          />
          <button 
            onClick={handleAdd}
            disabled={!newText || !newDate || loading}
            className="bg-blue-600 text-white rounded px-2 hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* List Area */}
      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
        {reminders.length === 0 && (
          <p className="text-[10px] text-slate-500 text-center italic py-2">Nenhum lembrete agendado.</p>
        )}
        {reminders.sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()).map(rem => (
          <div 
            key={rem.id} 
            className={`flex items-start justify-between p-2 rounded border border-slate-700 ${rem.notified ? 'bg-red-900/20 border-red-800' : 'bg-slate-900'}`}
          >
            <div className="flex-1 min-w-0 mr-2">
              <div className="flex items-center space-x-1 mb-0.5">
                 {rem.notified ? <BellRing className="h-3 w-3 text-red-400 animate-pulse" /> : <Bell className="h-3 w-3 text-slate-400" />}
                 <span className={`text-xs font-medium truncate ${rem.notified ? 'text-red-300' : 'text-slate-200'}`}>{rem.text}</span>
              </div>
              <div className="text-[10px] text-slate-500">
                {new Date(rem.datetime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}
              </div>
            </div>
            <button onClick={() => handleDelete(rem.id)} className="text-slate-500 hover:text-red-400">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 4. Coordinate Converter (Dec -> DMS) ---
const ConverterWidget = () => {
  const [decimal, setDecimal] = useState('');
  const [result, setResult] = useState('');

  const convert = () => {
    const val = parseFloat(decimal);
    if (isNaN(val)) {
      setResult('Inválido');
      return;
    }

    const absolute = Math.abs(val);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);

    setResult(`${val < 0 ? '-' : ''}${degrees}° ${minutes}' ${seconds}"`);
  };

  return (
    <div className="space-y-2">
      <input
        type="number"
        placeholder="Dec: -23.5505"
        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:ring-blue-500"
        value={decimal}
        onChange={e => setDecimal(e.target.value)}
      />
      <Button size="sm" variant="secondary" className="w-full h-6 text-xs" onClick={convert}>
        Converter para DMS
      </Button>
      {result && (
        <div className="bg-slate-900 p-2 rounded text-center text-xs text-blue-300 font-mono border border-slate-700">
          {result}
        </div>
      )}
    </div>
  );
};

// --- Main Sidebar Widgets Component ---
export const SidebarWidgets: React.FC = () => {
  return (
    <div className="flex flex-col border-t border-slate-800 bg-slate-900/50">
      <WidgetSection title="Data e Hora" icon={<Clock className="h-3 w-3" />} defaultOpen={true}>
        <ClockWidget />
      </WidgetSection>

      <WidgetSection title="Calculadora" icon={<Calculator className="h-3 w-3" />}>
        <CalculatorWidget />
      </WidgetSection>

      <WidgetSection title="Lembretes" icon={<StickyNote className="h-3 w-3" />}>
        <RemindersWidget />
      </WidgetSection>

      <WidgetSection title="Conv. Coordenadas" icon={<Globe className="h-3 w-3" />}>
        <ConverterWidget />
      </WidgetSection>
    </div>
  );
};
