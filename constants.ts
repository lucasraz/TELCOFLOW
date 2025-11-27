import { Ticket, TicketStatus, TicketType } from './types';

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TC-2023-001',
    ardName: 'ARD Central Sul',
    coordinates: '-23.550520, -46.633308',
    uf: 'SP',
    city: 'São Paulo',
    requester: 'João Silva',
    type: TicketType.B2B,
    client: 'Banco XPTO',
    value: 15400.50,
    currentStatus: TicketStatus.APROVADO,
    createdAt: '2023-10-01T10:00:00Z',
    entryDate: '2023-10-01',
    isSubstitute: false,
    history: [
      { date: '2023-10-01T10:00:00Z', status: TicketStatus.RECEBIDO, note: 'Entrada inicial', updatedBy: 'Sistema' },
      { date: '2023-10-05T16:30:00Z', status: TicketStatus.APROVADO, note: 'Finalizado com sucesso', updatedBy: 'Admin' },
    ]
  },
  {
    id: 'TC-2023-002',
    ardName: 'ARD Norte',
    coordinates: '-3.119028, -60.021731',
    uf: 'AM',
    city: 'Manaus',
    requester: 'Maria Oliveira',
    type: TicketType.DESLIGUE_COBRE,
    value: 5200.00,
    currentStatus: TicketStatus.PENDENCIA_EMPREITEIRA,
    createdAt: new Date(Date.now() - 50 * 3600 * 1000).toISOString(), // 50 horas atrás (Estourado SLA)
    entryDate: '2023-10-10',
    isSubstitute: false,
    history: [
        { date: '2023-10-10T09:15:00Z', status: TicketStatus.RECEBIDO, note: 'Entrada inicial', updatedBy: 'Sistema' },
        { date: '2023-10-11T11:00:00Z', status: TicketStatus.PENDENCIA_EMPREITEIRA, note: 'Falta laudo técnico', updatedBy: 'Super' },
    ]
  },
  {
    id: 'TC-2023-003',
    ardName: 'ARD Leste',
    uf: 'RJ',
    city: 'Rio de Janeiro',
    requester: 'Carlos Souza',
    type: TicketType.B2B,
    client: 'Farmácia Global',
    value: 23000.00,
    currentStatus: TicketStatus.NA_FILA,
    createdAt: new Date().toISOString(), // Recente
    entryDate: new Date().toISOString().split('T')[0],
    isSubstitute: true,
    previousTicketId: 'TC-2022-999',
    history: [
        { date: new Date().toISOString(), status: TicketStatus.RECEBIDO, note: 'Substituição do ID TC-2022-999', updatedBy: 'Sistema' },
        { date: new Date().toISOString(), status: TicketStatus.NA_FILA, note: 'Movido para fila', updatedBy: 'Sistema' },
    ]
  },
  {
    id: 'TC-2023-004',
    ardName: 'ARD Interior',
    uf: 'MG',
    city: 'Belo Horizonte',
    requester: 'Ana Costa',
    type: TicketType.DESLIGUE_COBRE,
    value: 3100.00,
    currentStatus: TicketStatus.CANCELADO,
    createdAt: '2023-10-18T10:00:00Z',
    entryDate: '2023-10-18',
    isSubstitute: false,
    history: [
        { date: '2023-10-18T10:00:00Z', status: TicketStatus.RECEBIDO, note: 'Aguardando triagem', updatedBy: 'Sistema' },
        { date: '2023-10-19T10:00:00Z', status: TicketStatus.CANCELADO, note: 'Inviabilidade técnica', updatedBy: 'Admin' },
    ]
  }
];

export const STATES_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const ROLES = [
  'Projetista',
  'Supervisor',
  'Analista',
  'Coordenador',
  'Gerência',
  'Diretoria'
];

// Mock simples de cidades (apenas capitais e algumas principais para exemplo)
export const CITIES_BY_STATE: Record<string, string[]> = {
  'SP': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'Sorocaba', 'São Bernardo do Campo'],
  'RJ': ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'São Gonçalo'],
  'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora'],
  'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas'],
  'PR': ['Curitiba', 'Londrina', 'Maringá'],
  'BA': ['Salvador', 'Feira de Santana'],
  'PE': ['Recife', 'Jaboatão dos Guararapes'],
  'AM': ['Manaus', 'Parintins'],
  // Adicionar fallback genérico para o demo
};

export const getCitiesByState = (uf: string): string[] => {
  return CITIES_BY_STATE[uf] || ['Capital', 'Interior', 'Cidade Exemplo 1', 'Cidade Exemplo 2'];
}