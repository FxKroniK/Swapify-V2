import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Transaction } from '../../models/transaction.model'; // Importar interfaz compartida

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:8084/transactions';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json',
    });
  }

  createTransaction(productId: string, creditsOffered: number): Observable<Transaction> {
    const body = {
      productOfferedId: productId,
      creditsOffered,
    };
    return this.http
      .post<Transaction>(this.apiUrl, body, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          console.error('Error creating transaction:', err);
          return throwError(() => new Error('No se pudo crear la transacción'));
        })
      );
  }

  updateTransactionStatus(
    transactionId: number,
    status: 'ACCEPTED' | 'REJECTED',
    productRequestedId?: string
  ): Observable<Transaction> {
    const body = {
      status,
      productRequestedId: productRequestedId || null,
    };
    return this.http
      .put<Transaction>(`${this.apiUrl}/${transactionId}/status`, body, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((err) => {
          console.error('Error updating transaction status:', err);
          return throwError(() => new Error('No se pudo actualizar el estado de la transacción'));
        })
      );
  }

  getTransaction(transactionId: number): Observable<Transaction> {
    return this.http
      .get<Transaction>(`${this.apiUrl}/${transactionId}`, { headers: this.getHeaders() })
      .pipe(
        catchError((err) => {
          console.error('Error fetching transaction:', err);
          return throwError(() => new Error('No se pudo obtener la transacción'));
        })
      );
  }

  getCompletedTransactionsBetweenUsers(userA: number, userB: number): Observable<Transaction[]> {
    return this.http
      .get<Transaction[]>(`${this.apiUrl}/completed/full`, {
        headers: this.getHeaders(),
        params: { userA: userA.toString(), userB: userB.toString() },
      })
      .pipe(
        catchError((err) => {
          console.error('Error fetching completed transactions:', err);
          return throwError(() => new Error('No se pudieron obtener las transacciones completadas'));
        })
      );
  }
  

}