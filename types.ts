
export type User = {
  id: string; // UUID do Supabase
  email?: string;
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
  RECEBIDO = 'Recebido',
  NA_FILA = 'Na Fila',
  PENDENCIA_CLIENTE = 'Pendência Cliente',
  PENDENCIA_EMPREITEIRA = 'Pendência Empreiteira',
  DEVOLVIDO = 'Devolvido',
  APROVADO = 'Aprovado',
  CANCELADO = 'Cancelado',
}

export type HistoryLog = {
  id?: string;
  date: string; // ISO String
  status: TicketStatus;
  note: string;
  updatedBy: string;
};

export type Ticket = {
  id: string; // ID Manual (TC-...)
  ardName: string;
  coordinates?: string;
  clientCoordinates?: string;
  uf: string;
  city: string;
  requester: string;
  type: TicketType;
  client?: string;
  value: number;
  currentStatus: TicketStatus;
  createdAt: string;
  entryDate: string;
  attachmentName?: string;
  attachmentUrl?: string;
  isSubstitute: boolean;
  previousTicketId?: string;
  history: HistoryLog[];
  user_id?: string; // Criador do ticket
};