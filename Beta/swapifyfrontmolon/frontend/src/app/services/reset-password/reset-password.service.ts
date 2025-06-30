import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ResetPasswordService {
private apiUrl = 'http://localhost:8081/auth';
  constructor(private http: HttpClient) { }

  /**
   * Envia la solicitud para iniciar el reseteo de contraseña.
   */
  requestPasswordReset(useremail: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { useremail });
  }

  /**
   * Confirma el reseteo con el token y nueva contraseña.
   */
  confirmPasswordReset(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm-reset`, { token, newPassword });
  }
}
