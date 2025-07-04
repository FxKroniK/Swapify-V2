// src/app/services/review-service/review.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Review, ReviewDTO, RevieweableProductDto } from '../../models/review.model';
@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'http://localhost:8091/api/reviews';

  constructor(private http: HttpClient) {}

  createReview(reviewDto: ReviewDTO, token: string): Observable<Review> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<Review>(this.apiUrl, reviewDto, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  getReviewableProducts(userId: string, token: string): Observable<RevieweableProductDto[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<RevieweableProductDto[]>(`${this.apiUrl}/available-products?userId=${userId}`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  getReviewsForUser(userId: string, token: string): Observable<Review[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Review[]>(`${this.apiUrl}/user/${userId}`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  getAverageRating(userId: string, token: string): Observable<number> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<number>(`${this.apiUrl}/user/${userId}/rating`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  getPositiveNegativeCounts(userId: string, token: string): Observable<{ positives: number, negatives: number }> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<{ positives: number, negatives: number }>(`${this.apiUrl}/user/${userId}/counts`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en la llamada a la API de reseñas:', error);
    return throwError(() => new Error('Error al procesar la solicitud de reseñas.'));
  }
}