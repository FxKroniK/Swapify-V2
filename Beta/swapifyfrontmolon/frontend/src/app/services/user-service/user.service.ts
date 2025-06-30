import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserDto, UserProfile } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8082/api/users';

  constructor(private http: HttpClient) {}

  create(token: string): Observable<UserDto> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.post<UserDto>(`${this.apiUrl}/create`, {}, { headers });
  }

  getUserProfile(token: string): Observable<UserProfile> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<UserProfile>(`${this.apiUrl}/me`, { headers });
  }

  getUserById(userId: number, token: string): Observable<UserProfile> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<UserProfile>(`${this.apiUrl}/profile/${userId}`, { headers });
  }

  updateUserProfile(token: string, profileData: any): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.patch(`${this.apiUrl}/me`, profileData, { headers });
  }

  updateUserLocation(userId: number, locationData: any, token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put(`${this.apiUrl}/${userId}/location`, locationData, { headers });
  }
}