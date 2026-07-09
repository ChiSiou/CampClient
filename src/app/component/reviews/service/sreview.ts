import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IReview } from '../interfaces/IReview';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SReview {

  private connString = `${environment.apiUrl}/APIReview`;
  private apiUrl = `${environment.apiUrl}/Member`;

  constructor(
    private httpClient: HttpClient,
    private routes: Router,
    private messageService: MessageService,
  ) { }

  getUserId() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      return Number(decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']);
    }
    return 0;
  }

  getCampId() {
    //TODO 等營地那邊做完再改
    return 1;
  }

  getRiviewAPI(campId?: number) {
    const params = campId ? { params: { campId } } : {};
    return this.httpClient.get<IReview[]>(this.connString, params);
  }

  getRiviewByIdAPI(id: number) {
    return this.httpClient.get<IReview[]>(`${this.connString}/${id}`);
  }

  postRiviewAPI(para: IReview) {
    return this.httpClient.post<IReview[]>(this.connString, para);
  }

  deleteReviewAPI(id: number) {
    return this.httpClient.delete<IReview[]>(`${this.connString}/${id}`);
  }

  uploadImage(formData: FormData) {
    return this.httpClient.post<{ imageUrl: string }>(`${environment.apiUrl}/Upload/review-image`, formData);
  }

  putReviewAPI(id: number, para: IReview) {
    return this.httpClient.put<IReview[]>(`${this.connString}/${id}`, para);
  }

}
