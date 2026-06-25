import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { HomeFeedDto, CampExplorationDto } from '../interfaces/camp.interface';

@Injectable({ providedIn: 'root' })
export class ExplorationService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getHome() {
    return this.http.get<HomeFeedDto>(`${this.base}/Exploration/home`);
  }

  getCampground(id: number) {
    return this.http.get<CampExplorationDto>(`${this.base}/Exploration/campground/${id}`);
  }
}
