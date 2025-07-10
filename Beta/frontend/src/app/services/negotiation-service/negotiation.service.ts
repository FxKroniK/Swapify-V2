import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Transaction } from '../../models/transaction.model';

interface Conversation {
  id: number;
  productId: string;
  buyerId: number;
  sellerId: number;
  messages: any[];
  status: string;
  proposalProductIds?: string;
  proposalCreditsOffered?: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NegotiationService {
  private apiUrl = 'http://localhost:8085/api/negotiations';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
    });
  }

  startNegotiation(productId: string): Observable<Conversation> {
    return this.http
      .post<Conversation>(`${this.apiUrl}/start`, null, {
        headers: this.getHeaders(),
        params: { productId },
      })
      .pipe(
        catchError((err) => {
          console.error('Error starting negotiation:', err);
          return throwError(() => new Error('No se pudo iniciar la conversación'));
        })
      );
  }

  getNegotiation(id: number): Observable<Conversation> {
    return this.http
      .get<Conversation>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          console.error('Error fetching negotiation:', err);
          return throwError(() => new Error('No se pudo obtener la conversación'));
        })
      );
  }

  sendMessage(
    conversationId: number,
    content: string,
    type: string = 'TEXT',
    productId?: string,
    creditsOffered?: number
  ): Observable<any> {
    const params: any = { content, type };
    if (productId) params.productId = productId;
    if (creditsOffered !== undefined) params.creditsOffered = creditsOffered.toString();
    return this.http
      .post(`${this.apiUrl}/${conversationId}/messages`, null, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(
        catchError((err) => {
          console.error('Error sending message:', err);
          return throwError(() => new Error('No se pudo enviar el mensaje'));
        })
      );
  }

  getUserConversations(): Observable<Conversation[]> {
    return this.http
      .get<Conversation[]>(`${this.apiUrl}/user`, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          console.error('Error fetching user conversations:', err);
          return throwError(() => new Error('No se pudieron obtener las conversaciones'));
        })
      );
  }

  deleteConversation(conversationId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${conversationId}`, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          console.error('Error deleting conversation:', err);
          return throwError(() => new Error('No se pudo eliminar la conversación'));
        })
      );
  }

  createTransaction(conversationId: number): Observable<Transaction> {
    return this.http
      .post<Transaction>(`${this.apiUrl}/${conversationId}/transactions`, { conversationId }, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.error('Error creating transaction:', err);
          return throwError(() => new Error('No se pudo crear la transacción'));
        })
      );
  }

  confirmTransaction(conversationId: number, transactionId: number, accept: boolean): Observable<Transaction> {
    const body = { status: accept ? 'ACCEPTED' : 'REJECTED' };
    return this.http
      .put<Transaction>(`http://localhost:8084/transactions/${transactionId}/status`, body, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.error('Error confirming transaction:', err);
          return throwError(() => new Error('No se pudo confirmar la transacción'));
        })
      );
  }
}