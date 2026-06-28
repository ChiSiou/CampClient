import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  CampMutiCalendarDto,
  CampZoneDetailDto,
  CampZoneCalendarDto,
  CampSelectionRequestDto,
  CampOrderSummaryDto,
  ZoneOrderSummaryDto,
} from '../interfaces/camp.interface';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getGantt(campgroundId: number, start: string, days = 10) {
    return this.http.get<CampMutiCalendarDto>(
      `${this.base}/Calendar/${campgroundId}/gantt?start=${start}&days=${days}`
    );
  }

  getZoneDetail(zoneId: number) {
    return this.http.get<CampZoneDetailDto>(`${this.base}/Calendar/zone/${zoneId}/detail`);
  }

  getZoneCalendar(zoneId: number, checkIn?: string, checkOut?: string) {
    let url = `${this.base}/Calendar/zone/${zoneId}/calendar`;
    const params: string[] = [];
    if (checkIn) params.push(`checkIn=${checkIn}`);
    if (checkOut) params.push(`checkOut=${checkOut}`);
    if (params.length) url += '?' + params.join('&');
    return this.http.get<CampZoneCalendarDto>(url);
  }

  getGenericZoneSummary(body: { zoneId: number; quantity: number; checkInDate: string; checkOutDate: string }) {
    return this.http.post<ZoneOrderSummaryDto>(`${this.base}/Calendar/zone/summary?type=generic`, body);
  }

  getUnitZoneSummary(body: { campsiteId: number; checkInDate: string; checkOutDate: string }) {
    return this.http.post<ZoneOrderSummaryDto>(`${this.base}/Calendar/zone/summary?type=unit`, body);
  }

  getSummary(body: CampSelectionRequestDto) {
    return this.http.post<CampOrderSummaryDto>(`${this.base}/Calendar/summary`, body);
  }
}
