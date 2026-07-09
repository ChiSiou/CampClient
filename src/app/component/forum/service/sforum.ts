import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IForum, IPostEmbedCard } from '../interfaces/Iforum';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { IReply } from '../interfaces/IReply';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Sforum {
  private apiUrl = `${environment.apiUrl}/APIPost`;
  private apiReplyUrl = `${environment.apiUrl}/APIReply`;
  private apiExplorationUrl = `${environment.apiUrl}/Exploration`;

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

  getUserName(post: IForum): string {
    return post.userName ?? '';
  }

  getPosts(page: number = 1, size: number = 20, keyword?: string): Observable<IForum[]> {
    let url = `${this.apiUrl}?page=${page}&size=${size}`;
    if (keyword) {
      url += `&keyword=${encodeURIComponent(keyword)}`;
    }
    return this.http.get<IForum[]>(url);
  }

  getPostById(id: number) {
    return this.http.get<IForum>(`${this.apiUrl}/${id}`);
  }

  getRelatedPosts(postId: number, size: number = 6): Observable<IForum[]> {
    return this.http.get<IForum[]>(`${this.apiUrl}/${postId}/related?size=${size}`);
  }

  postPost(para: IForum) {
    return this.http.post<IForum[]>(this.apiUrl, para);
  }

  deletePost(id: number) {
    return this.http.delete<IForum[]>(`${this.apiUrl}/${id}`);
  }

  uploadImage(formData: FormData) {
    return this.http.post<{ imageUrl: string }>(`${environment.apiUrl}/Upload/review-image`, formData);
  }

  putPostAPI(id: number, para: IForum) {
    return this.http.put<IForum[]>(`${this.apiUrl}/${id}`, para);
  }

  // 回覆

  getReplyByPostId(postId: number) {
    return this.http.get<IReply[]>(`${this.apiReplyUrl}?postId=${postId}`);
  }

  postReply(para: IReply) {
    return this.http.post<IReply[]>(this.apiReplyUrl, para);
  }

  putReply(id: number, para: IReply) {
    return this.http.put<IReply[]>(`${this.apiReplyUrl}/${id}`, para);
  }

  deleteReply(id: number) {
    return this.http.delete<IReply[]>(`${this.apiReplyUrl}/${id}`);
  }

  // 代入卡片：搜尋營地／自然景點

  searchCampsForEmbed(keyword: string) {
    return this.http.get<IPostEmbedCard[]>(`${this.apiExplorationUrl}/camps/search`, { params: { keyword } });
  }

  searchAttractionsForEmbed(keyword: string) {
    return this.http.get<IPostEmbedCard[]>(`${this.apiExplorationUrl}/attractions/search`, { params: { keyword } });
  }

}
