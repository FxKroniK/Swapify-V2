export interface Message {
    id: number;
    senderId: number;
    conversationId: number;
    text: string;
    time: string;
    type: 'TEXT' | 'PROPOSAL' | 'SYSTEM' | 'PROPOSAL_RESPONSE';
    productId?: string;
    creditsOffered?: number;
    isSystem?: boolean;
  }