import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IForum } from '../interfaces/Iforum';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class Sforum {
  private apiUrl = 'https://localhost:7011/api/APIPost';

  constructor(
    private http: HttpClient,
  ) { }

  getUserId(): number {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      return Number(decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);
    }
    return 0;
  }

  getPosts(page: number = 1, size: number = 20): Observable<IForum[]> {
    return this.http.get<IForum[]>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getPostById(id: number) {
    return this.http.get<IForum>(`${this.apiUrl}/${id}`);
  }

  postPost(para: IForum) {
    return this.http.post<IForum[]>(this.apiUrl, para);
  }

  deletePost(id: number) {
    return this.http.delete<IForum[]>(`${this.apiUrl}/${id}`);
  }

  uploadImage(formData: FormData) {
    return this.http.post<{ imageUrl: string }>('https://localhost:7011/api/Upload/review-image', formData);
  }

  putPostAPI(id: number, para: IForum) {
    return this.http.put<IForum[]>(`${this.apiUrl}/${id}`, para);
  }


}
