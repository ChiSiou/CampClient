import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IReview } from '../interfaces/IReview';

@Injectable({
  providedIn: 'root',
})
export class SReview {

  constructor(private httpClient: HttpClient) { }

  getRiviewAPI() {
    return this.httpClient.get<IReview[]>('http://localhost:5227/Review');
  }

}
