import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private apiUrl = 'http://localhost:8088/cloudinary/upload';
  constructor( private http: HttpClient) { }

  uploadImage(file: File, token: string): Observable<any> {
    const formData = new FormData();
    formData.append('multipartFile', file);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post(this.apiUrl, formData, { headers });
  }
}
