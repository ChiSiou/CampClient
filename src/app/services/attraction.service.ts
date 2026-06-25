import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AttractionDetailDto } from '../interfaces/attraction.interface';

@Injectable({ providedIn: 'root' })
export class AttractionService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getDetail(id: number) {
    return this.http.get<AttractionDetailDto>(`${this.base}/Exploration/attraction/${id}`);
  }
}
