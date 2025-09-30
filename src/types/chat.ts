export interface CreateThreadRequest {
  specialistId: string;
  requestId?: string | null;
}

export interface CreateThreadResponse {
  thread: ChatThread;
}

export interface GetThreadsResponse {
  threads: ChatThread[];
  total: number;
}

export interface ChatThread {
  id: string;
  clientId: string;
  specialistId: string;
  requestId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessage?: ChatMessage;
  peer?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
}

export interface SendMessageRequest {
  threadId: string;
  content: string;
  attachmentUrl?: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

export interface GetMessagesResponse {
  messages: ChatMessage[];
}

export interface MarkAsReadRequest {
  threadId: string;
}

export interface MarkAsReadResponse {
  success: boolean;
}

