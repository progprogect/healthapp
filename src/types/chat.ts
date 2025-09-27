export interface CreateThreadRequest {
  specialistId: string;
  requestId?: string | null;
}

export interface ChatThread {
  id: string;
  clientId: string;
  specialistId: string;
  requestId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
}
