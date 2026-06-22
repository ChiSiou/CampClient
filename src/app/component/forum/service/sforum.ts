import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IForum } from '../interfaces/Iforum';

@Injectable({
  providedIn: 'root',
})
export class Sforum {
  private apiUrl = 'https://localhost:7011/api/APIPost';

  constructor(private http: HttpClient) { }

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
