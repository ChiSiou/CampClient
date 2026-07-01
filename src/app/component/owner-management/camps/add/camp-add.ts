import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import { CampgroundCreateDto } from '../../../../interfaces/camp-management.interface';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

@Component({
  selector: 'app-camp-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './camp-add.html',
  styleUrl: './camp-add.css',
})
export class CampAdd implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map?: L.Map;
  private marker?: L.Marker;

  form: CampgroundCreateDto = {
    name: '',
    phone: '',
    elevation: 0,
    description: '',
    website: '',
    basePrice: 0,
    area: '',
    latitude: 0,
    longitude: 0,
    rules: '',
    highlights: '',
    facilityIds: [],
    tagIds: [],
  };
  submitting = false;
  locating = false;
  error = '';

  constructor(private campService: CampManagementService, private router: Router) {}

  ngAfterViewInit() {
    this.map = L.map(this.mapContainer.nativeElement).setView([23.5, 121.0], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private setLocation(lat: number, lng: number) {
    this.form.latitude = Math.round(lat * 1000000) / 1000000;
    this.form.longitude = Math.round(lng * 1000000) / 1000000;
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng]).addTo(this.map!);
    }
  }

  async locateByAddress() {
    if (!this.form.area.trim()) return;
    this.locating = true;
    this.error = '';
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(this.form.area)}&limit=1&bbox=118,21,123,26`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        this.map?.setView([lat, lng], 13);
        this.setLocation(lat, lng);
      } else {
        this.error = '找不到此地址，請調整關鍵字或直接點地圖選點';
      }
    } catch {
      this.error = '定位失敗，請直接點地圖選點';
    } finally {
      this.locating = false;
    }
  }

  submit() {
    if (!this.form.name.trim() || !this.form.area.trim()) {
      this.error = '請填寫必填欄位（名稱、地區）';
      return;
    }
    this.submitting = true;
    this.error = '';
    const dto: CampgroundCreateDto = {
      ...this.form,
      latitude: +this.form.latitude || 0,
      longitude: +this.form.longitude || 0,
      elevation: +this.form.elevation || 0,
      basePrice: +this.form.basePrice || 0,
    };
    this.campService.createCampground(dto).subscribe({
      next: (res) => this.router.navigate(['/ownerCenter/camps', res.id]),
      error: (err) => {
        this.error = err.error?.message ?? '建立失敗，請稍後再試';
        this.submitting = false;
      },
    });
  }

  cancel() {
    this.router.navigate(['/ownerCenter/camps']);
  }
}
