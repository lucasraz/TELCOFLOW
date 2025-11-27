import React, { useState } from 'react';
import { Ticket, TicketStatus, TicketType, User } from '../types';
import { STATES_BR } from '../constants';
import { Button } from './Button';
import { UploadCloud, Calendar, MapPin } from 'lucide-react';

interface NewEntryFormProps {
  user: User;
  onSubmit: (ticket: Ticket) => void;
  onCancel: () => void;
}

export const NewEntryForm: React.FC<NewEntryFormProps> = ({ user, onSubmit, onCancel }) => {
  const [manualId, setManualId] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [ardName, setArdName] = useState('');
  const [coordinates, setCoordinates] = useState('');
  const [uf, setUf] = useState('');
  const [city, setCity] = useState('');
  const [requester, setRequester] = useState('');
  const [type, setType] = useState<TicketType>(TicketType.B2B);
  const [client, setClient] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  
  // Logic for substitution
  const [isSubstitute, setIsSubstitute] = useState(false);
  const [previousTicketId, setPreviousTicketId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTicket: Ticket = {
      id: manualId,
      ardName,
      coordinates,
      uf,
      city,
      requester,
      type,
      client: type === TicketType.B2B ? client : undefined,
      value: 0, // Valor começa zerado, preenchido no workflow
      currentStatus: TicketStatus.RECEBIDO,
      createdAt: new Date().toISOString(), // Audit creation time
      entryDate: entryDate, // User defined date
      attachmentName: attachment?.name,
      attachmentUrl: attachment ? URL.createObjectURL(attachment) : undefined, // Fake URL for demo
      isSubstitute,
      previousTicketId: isSubstitute ? previousTicketId : undefined,
      history: [
        {
          date: new Date().toISOString(),
          status: TicketStatus.RECEBIDO,
          note: isSubstitute ? `Ticket criado como substituto do ID: ${previousTicketId}` : 'Ticket recebido via formulário de entrada.',
          updatedBy: user.name
        }
      ]
    };

    onSubmit(newTicket);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-4xl mx-auto border-t-4 border-blue-600">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h3 className="text-xl font-bold text-slate-900">Novo Registro de Entrada</h3>
        <p className="text-sm text-slate-500">Preencha os dados da nova demanda para iniciar a esteira.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Linha 1: ID, Data, Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-md">
            <div>
                <label className="block text-sm font-bold text-slate-700">ID do Ticket (Manual)</label>
                <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                placeholder="Ex: T-9999"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700">Data de Entrada</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                    type="date"
                    required
                    className="block w-full pl-10 rounded-md border-slate-300 border p-2 focus:border-blue-500 focus:ring-blue-500"
                    value={entryDate}
                    onChange={e => setEntryDate(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700">Tipo de Projeto</label>
                <select
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                value={type}
                onChange={e => {
                    setType(e.target.value as TicketType);
                    if (e.target.value === TicketType.DESLIGUE_COBRE) setClient('');
                }}
                >
                {Object.values(TicketType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
        </div>

        {/* Substituição Logic */}
        <div className="flex items-center space-x-2 bg-yellow-50 p-3 rounded-md border border-yellow-100">
             <input 
                id="isSubstitute" 
                type="checkbox" 
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={isSubstitute}
                onChange={e => setIsSubstitute(e.target.checked)}
             />
             <label htmlFor="isSubstitute" className="ml-2 block text-sm text-slate-900 font-medium">
                Este ticket é um substituto de um anterior?
             </label>
             {isSubstitute && (
                 <div className="flex-1 ml-4 animate-fade-in">
                     <input
                        type="text"
                        required={isSubstitute}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-1 text-sm"
                        placeholder="Informe o ID do Ticket Anterior"
                        value={previousTicketId}
                        onChange={e => setPreviousTicketId(e.target.value)}
                     />
                 </div>
             )}
        </div>

        {/* Dados do Local e Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome ARD / Identificador</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={ardName}
              onChange={e => setArdName(e.target.value)}
              placeholder="Ex: ARD-1234-SP"
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700">Coordenadas</label>
             <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-slate-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-9 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    value={coordinates}
                    onChange={e => setCoordinates(e.target.value)}
                    placeholder="-23.5505, -46.6333"
                />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">UF</label>
            <select
              required
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={uf}
              onChange={e => setUf(e.target.value)}
            >
              <option value="">Selecione...</option>
              {STATES_BR.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Cidade</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Digite o nome da cidade"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Solicitante</label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                value={requester}
                onChange={e => setRequester(e.target.value)}
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Cliente (Apenas B2B)</label>
                <input
                type="text"
                disabled={type !== TicketType.B2B}
                required={type === TicketType.B2B}
                className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 ${type !== TicketType.B2B ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                value={client}
                onChange={e => setClient(e.target.value)}
                placeholder={type === TicketType.B2B ? "Nome do Cliente" : "Não aplicável"}
                />
            </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Evidência (Print do E-mail)</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:bg-slate-50 transition-colors">
            <div className="space-y-1 text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
              <div className="flex text-sm text-slate-600 justify-center">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload de arquivo</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={e => setAttachment(e.target.files ? e.target.files[0] : null)} accept="image/*,application/pdf" />
                </label>
                <p className="pl-1">ou arraste e solte</p>
              </div>
              <p className="text-xs text-slate-500">
                {attachment ? `Arquivo selecionado: ${attachment.name}` : "PNG, JPG, PDF até 10MB"}
              </p>
            </div>
          </div>
        </div>

        {/* Map Preview */}
        {coordinates && (
            <div className="rounded-lg overflow-hidden border border-slate-200">
                <div className="bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" /> Pré-visualização de Localização
                </div>
                <div className="h-64 w-full bg-slate-50">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={`https://maps.google.com/maps?q=${coordinates}&hl=pt-br&z=18&output=embed`}
                        title="Map Preview"
                    ></iframe>
                </div>
            </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Registrar Entrada</Button>
        </div>
      </form>
    </div>
  );
};