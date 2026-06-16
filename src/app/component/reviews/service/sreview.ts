import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IReview } from '../interfaces/IReview';

@Injectable({
  providedIn: 'root',
})
export class SReview {

  constructor(private httpClient: HttpClient) { }

  connString = "http://localhost:5192/api/APIReview";

  getRiviewAPI() {
    return this.httpClient.get<IReview[]>(this.connString);
  }

  postRiviewAPI(para: IReview) {
    return this.httpClient.post<IReview[]>(this.connString, para);
  }

  uploadImage(formData: FormData) {
    return this.httpClient.post<{ imageUrl: string }>('http://localhost:5192/api/Upload/review-image', formData);
  }

}
