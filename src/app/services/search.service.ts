import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  CampSearchRequest,
  CampSearchResponseDto,
  CampMapResponseDto,
  CampFilterDto,
} from '../interfaces/camp.interface';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  search(body: CampSearchRequest) {
    return this.http.post<CampSearchResponseDto>(`${this.base}/Search`, body);
  }

  searchMap(body: CampSearchRequest) {
    return this.http.post<CampMapResponseDto>(`${this.base}/Search/map`, body);
  }

  getFilters() {
    return this.http.get<CampFilterDto>(`${this.base}/Search/filters`);
  }
}
