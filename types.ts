export type User = {
  name: string;
  ra: string;
  role: string;
  networkLogin: string;
};

export enum TicketType {
  B2B = 'B2B',
  DESLIGUE_COBRE = 'Desligue Cobre',
}

export enum TicketStatus {
  RECEBIDO = 'Recebido', // Status inicial
  NA_FILA = 'Na Fila',
  PENDENCIA_CLIENTE = 'Pendência Cliente',
  PENDENCIA_EMPREITEIRA = 'Pendência Empreiteira',
  DEVOLVIDO = 'Devolvido',
  APROVADO = 'Aprovado',
  CANCELADO = 'Cancelado',
}

export type HistoryLog = {
  date: string; // ISO String
  status: TicketStatus;
  note: string;
  updatedBy: string;
};

export type Ticket = {
  id: string; // ID Manual inserido pelo usuário
  ardName: string;
  coordinates?: string; // Lat, Long
  uf: string;
  city: string;
  requester: string;
  type: TicketType;
  client?: string; // Apenas B2B
  value: number;
  currentStatus: TicketStatus;
  createdAt: string; // Data de criação do registro (audit)
  entryDate: string; // Data manual informada pelo usuário
  attachmentName?: string;
  attachmentUrl?: string; // URL mock para o anexo
  isSubstitute: boolean;
  previousTicketId?: string;
  history: HistoryLog[];
};