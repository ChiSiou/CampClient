import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  CampDetailDto,
  CampLocationDto,
  CampMapZoneDto,
} from '../interfaces/camp.interface';

@Injectable({ providedIn: 'root' })
export class CampDetailService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getDetail(id: number) {
    return this.http.get<CampDetailDto>(`${this.base}/CampDetail/${id}`);
  }

  getLocation(id: number) {
    return this.http.get<CampLocationDto>(`${this.base}/CampDetail/${id}/location`);
  }

  getZones(id: number, checkIn?: string, checkOut?: string) {
    let url = `${this.base}/CampDetail/${id}/zones`;
    const params: string[] = [];
    if (checkIn) params.push(`checkIn=${checkIn}`);
    if (checkOut) params.push(`checkOut=${checkOut}`);
    if (params.length) url += '?' + params.join('&');
    return this.http.get<CampMapZoneDto[]>(url);
  }
}
