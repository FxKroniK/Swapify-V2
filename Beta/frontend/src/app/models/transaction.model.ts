// src/app/models/transaction.model.ts
export interface Transaction {
    id: number;
    buyerId: number;
    sellerId: number;
    sellerEmail?: string;
    productOfferedId: string | null;
    productRequestedId?: string | null;
    creditsOffered: number;
    creditsRequested?: number;
    status: 'PENDING' | 'COMPLETED' | 'REJECTED';
    createdAt?: string;
    buyerAccepted: boolean;
    sellerAccepted: boolean;
  }