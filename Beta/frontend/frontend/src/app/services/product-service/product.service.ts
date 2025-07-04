import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Product } from '../../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'http://localhost:8083';

  constructor(private http: HttpClient) {}

  private getHeaders(token?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getAllProducts(token?: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`, { headers: this.getHeaders(token) })
      .pipe(
        catchError(this.handleError)
      );
  }

  getProductsByOwner(ownerId: number, token: string): Observable<Product[]> {
  return this.http.get<Product[]>(`${this.apiUrl}/products/ownerId/${ownerId}`, { headers: this.getHeaders(token) })
    .pipe(
      catchError(this.handleError)
    );
}

  getProductById(id: string, token: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`, { headers: this.getHeaders(token) })
      .pipe(
        catchError(this.handleError)
      );
  }

  createProduct(productData: any, token: string): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, productData, { headers: this.getHeaders(token) })
      .pipe(
        catchError(this.handleError)
      );
  }

  updateProduct(id: string, productData: Partial<Product>, token: string): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/products/${id}`, productData, { headers: this.getHeaders(token) })
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteProduct(productId: string, token: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${productId}`, { headers: this.getHeaders(token) })
      .pipe(
        catchError(this.handleError)
      );
  }

  getTrendingProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/trending`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  searchProductsByCoordinates(latitude: number, longitude: number, radius: number, category: string, keyword: string): Observable<Product[]> {
  console.log('Parámetros enviados:', { latitude, longitude, radius, category, keyword });
  let params = new HttpParams()
    .set('latitude', latitude.toString())
    .set('longitude', longitude.toString())
    .set('radius', radius.toString());
  if (category) {
    params = params.set('category', category);
  }
  if (keyword) {
    params = params.set('keyword', keyword);
  }
  const token = localStorage.getItem('token') ?? undefined; // Convierte null a undefined
  console.log('Token enviado:', token);
  return this.http.get<Product[]>(`${this.apiUrl}/products/by-coordinates`, { 
    headers: this.getHeaders(token), 
    params 
  }).pipe(
    catchError(this.handleError)
  );
}

  searchProducts(keyword: string, latitude: number, longitude: number, radius: number, category: string): Observable<Product[]> {
    let params = new HttpParams().set('keyword', keyword);
    if (latitude && longitude) {
      params = params.set('latitude', latitude.toString()).set('longitude', longitude.toString());
    }
    if (radius) {
      params = params.set('radius', radius.toString());
    }
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<Product[]>(`${this.apiUrl}/products/search`, { headers: this.getHeaders(), params })
      .pipe(
        catchError(this.handleError)
      );
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/category/${category}`, { headers: this.getHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  addFavorite(productId: string, token: string): Observable<any> {
    const body = { productId };
    return this.http.post(`${this.apiUrl}/products/favorites`, body, { headers: this.getHeaders(token) })
      .pipe(
        tap(() => console.log(`Solicitud enviada a /products/favorites para productId: ${productId}`)),
        catchError(this.handleError)
      );
  }

  removeFavorite(productId: string, token: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/favorites/${productId}`, { headers: this.getHeaders(token) })
      .pipe(
        tap(() => console.log(`Solicitud enviada a /products/favorites/${productId} para eliminar favorito`)),
        catchError(this.handleError)
      );
  }

  getUserFavorites(token: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products/favorites`, { headers: this.getHeaders(token) })
      .pipe(
        tap(() => console.log('Favoritos del usuario recuperados')),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';
    if (error.status === 0) {
      errorMessage = 'No se pudo conectar al servidor. Verifica que el backend esté en ejecución y que CORS esté configurado correctamente.';
    } else {
      errorMessage = `Error ${error.status}: ${error.statusText || error.message}`;
    }
    console.error('Error en ProductService:', error);
    return throwError(() => new Error(errorMessage));
  }
}