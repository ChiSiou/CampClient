import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IReview } from '../interfaces/IReview';

@Injectable({
  providedIn: 'root',
})
export class SReview {

  constructor(private httpClient: HttpClient) { }

  connString = "https://localhost:7011/api/APIReview";

  getRiviewAPI() {
    return this.httpClient.get<IReview[]>(this.connString);
  }

  postRiviewAPI(para: IReview) {
    return this.httpClient.post<IReview[]>(this.connString, para);
  }

  deleteReviewAPI(id: number) {
    return this.httpClient.delete<IReview[]>(`${this.connString}/${id}`);
  }

  uploadImage(formData: FormData) {
    return this.httpClient.post<{ imageUrl: string }>('https://localhost:7011/api/Upload/review-image', formData);
  }

}
