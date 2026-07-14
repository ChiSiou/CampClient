import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IPostInteract } from '../interfaces/IPostInteract';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SPostInteract {
  private apiUrl = `${environment.apiUrl}/APIPostInteract`;

  constructor(
    private http: HttpClient,
  ) { }

  getPostInteracts(postId?: number, userId?: number, page: number = 1, size: number = 20): Observable<IPostInteract[]> {
    let url = `${this.apiUrl}?page=${page}&size=${size}`;
    if (postId != null) {
      url += `&postId=${postId}`;
    }
    if (userId != null) {
      url += `&userId=${userId}`;
    }
    return this.http.get<IPostInteract[]>(url);
  }

  getPostInteractById(id: number): Observable<IPostInteract> {
    return this.http.get<IPostInteract>(`${this.apiUrl}/${id}`);
  }

  postPostInteract(para: IPostInteract): Observable<IPostInteract> {
    return this.http.post<IPostInteract>(this.apiUrl, para);
  }

  putPostInteract(id: number, para: IPostInteract) {
    return this.http.put(`${this.apiUrl}/${id}`, para);
  }

  deletePostInteract(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
