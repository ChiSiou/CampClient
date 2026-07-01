import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import {
  CampgroundCreateDto,
  CampgroundListItemDto,
  CampgroundOwnerDetailDto,
  CampzoneCreateDto,
  CampzoneListItemDto,
  CampsiteCreateDto,
  CampsiteUpdateDto,
  CampsiteListItemDto,
  CampMediumDto,
} from '../interfaces/camp-management.interface';

@Injectable({ providedIn: 'root' })
export class CampManagementService {
  private base = `${environment.apiUrl}/CampManagement`;

  constructor(private http: HttpClient) {}

  // Campground
  listMine(searchTerm?: string) {
    const url = searchTerm
      ? `${this.base}/mine?searchTerm=${encodeURIComponent(searchTerm)}`
      : `${this.base}/mine`;
    return this.http.get<CampgroundListItemDto[]>(url);
  }

  createCampground(dto: CampgroundCreateDto) {
    return this.http.post<CampgroundOwnerDetailDto>(this.base, dto);
  }

  getCampground(campgroundId: number) {
    return this.http.get<CampgroundOwnerDetailDto>(`${this.base}/${campgroundId}`);
  }

  updateCampground(campgroundId: number, dto: CampgroundCreateDto) {
    return this.http.put<CampgroundOwnerDetailDto>(`${this.base}/${campgroundId}`, dto);
  }

  deleteCampground(campgroundId: number) {
    return this.http.delete<void>(`${this.base}/${campgroundId}`);
  }

  updateCampgroundStatus(campgroundId: number, status: number) {
    return this.http.patch<void>(`${this.base}/${campgroundId}/status`, { status });
  }

  // Campzone
  listZones(campgroundId: number) {
    return this.http.get<CampzoneListItemDto[]>(`${this.base}/${campgroundId}/zones`);
  }

  createZone(campgroundId: number, dto: CampzoneCreateDto) {
    return this.http.post<CampzoneListItemDto>(`${this.base}/${campgroundId}/zones`, dto);
  }

  updateZone(zoneId: number, dto: CampzoneCreateDto) {
    return this.http.put<CampzoneListItemDto>(`${this.base}/zones/${zoneId}`, dto);
  }

  deleteZone(zoneId: number) {
    return this.http.delete<void>(`${this.base}/zones/${zoneId}`);
  }

  // Campsite
  listSites(zoneId: number) {
    return this.http.get<CampsiteListItemDto[]>(`${this.base}/zones/${zoneId}/sites`);
  }

  createSite(zoneId: number, dto: CampsiteCreateDto) {
    return this.http.post<CampsiteListItemDto>(`${this.base}/zones/${zoneId}/sites`, dto);
  }

  updateSite(siteId: number, dto: CampsiteUpdateDto) {
    return this.http.put<CampsiteListItemDto>(`${this.base}/sites/${siteId}`, dto);
  }

  deleteSite(siteId: number) {
    return this.http.delete<void>(`${this.base}/sites/${siteId}`);
  }

  // CampMedium（圖片相簿）
  listCampgroundPhotos(campgroundId: number) {
    return this.http.get<CampMediumDto[]>(`${this.base}/${campgroundId}/photos`);
  }

  uploadCampgroundPhoto(campgroundId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<CampMediumDto>(`${this.base}/${campgroundId}/photos`, formData);
  }

  listZonePhotos(zoneId: number) {
    return this.http.get<CampMediumDto[]>(`${this.base}/zones/${zoneId}/photos`);
  }

  uploadZonePhoto(zoneId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<CampMediumDto>(`${this.base}/zones/${zoneId}/photos`, formData);
  }

  listSitePhotos(siteId: number) {
    return this.http.get<CampMediumDto[]>(`${this.base}/sites/${siteId}/photos`);
  }

  uploadSitePhoto(siteId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<CampMediumDto>(`${this.base}/sites/${siteId}/photos`, formData);
  }

  deletePhoto(mediaId: number) {
    return this.http.delete<void>(`${this.base}/photos/${mediaId}`);
  }

  setCoverPhoto(mediaId: number) {
    return this.http.patch<void>(`${this.base}/photos/${mediaId}/cover`, {});
  }
}
