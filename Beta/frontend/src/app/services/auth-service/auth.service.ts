import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserDto } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/auth'; // Ajustado para coincidir con el backend
  private userSubject = new BehaviorSubject<UserDto | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUser();
  }

  register(registerData: { username: string; useremail: string; password: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, registerData).pipe(
      tap(response => console.log('Respuesta de registro:', response))
    );
  }

  login(loginData: { username: string; password: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/login`, loginData).pipe(
      tap(response => console.log('Respuesta de login:', response))
    );
  }

  updateUser(userData: UserDto) {
    this.userSubject.next(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }

  logout() {
    this.userSubject.next(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  private loadUser() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.userSubject.next(JSON.parse(storedUser));
    }
  }
}