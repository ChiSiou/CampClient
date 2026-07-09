import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import { CampgroundCreateDto, TagDto } from '../../../../interfaces/camp-management.interface';
import { PhotoGallery } from '../../shared/photo-gallery/photo-gallery';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

@Component({
  selector: 'app-camp-edit',
  imports: [CommonModule, FormsModule, RouterLink, PhotoGallery],
  templateUrl: './camp-edit.html',
  styleUrl: './camp-edit.css',
})
export class CampEdit implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map?: L.Map;
  private marker?: L.Marker;

  campgroundId!: number;
  campgroundName = '';
  loading = true;
  submitting = false;
  locating = false;
  fetchingElevation = false;
  error = '';
  highlightInput = '';

  tags: TagDto[] = [];
  tagsByCategory: { category: string; items: TagDto[] }[] = [];

  form: CampgroundCreateDto = {
    name: '', phone: '', elevation: 0, description: '', website: '',
    basePrice: 0, area: '', latitude: 0, longitude: 0, rules: '',
    highlights: [], facilityIds: [], tagIds: [],
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campService: CampManagementService
  ) {}

  ngAfterViewInit() {
    this.campgroundId = +this.route.snapshot.paramMap.get('campId')!;
    this.campService.getTags().subscribe({
      next: (tags) => {
        this.tags = tags;
        const grouped = new Map<string, TagDto[]>();
        tags.forEach(t => {
          if (!grouped.has(t.category)) grouped.set(t.category, []);
          grouped.get(t.category)!.push(t);
        });
        this.tagsByCategory = Array.from(grouped.entries()).map(([category, items]) => ({ category, items }));
      }
    });
    this.loadCampground();
  }

  toggleTag(id: number) {
    const idx = this.form.tagIds.indexOf(id);
    if (idx >= 0) this.form.tagIds.splice(idx, 1);
    else this.form.tagIds.push(id);
  }
  isTagSelected(id: number) { return this.form.tagIds.includes(id); }

  ngOnDestroy() { this.map?.remove(); }

  private initMap() {
    this.map = L.map(this.mapContainer.nativeElement).setView([23.5, 121.0], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
    this.map.on('click', (e: L.LeafletMouseEvent) => this.setLocation(e.latlng.lat, e.latlng.lng));
  }

  private loadCampground() {
    this.campService.getCampground(this.campgroundId).subscribe({
      next: (data) => {
        this.campgroundName = data.name;
        this.form = {
          name: data.name, phone: data.phone, elevation: data.elevation,
          description: data.description, website: data.website, basePrice: data.basePrice,
          area: data.area, latitude: data.latitude, longitude: data.longitude,
          rules: data.rules, highlights: [...data.highlights],
          facilityIds: [...data.facilityIds], tagIds: [...data.tagIds],
        };
        this.loading = false;
        setTimeout(() => {
          this.initMap();
          if (data.latitude && data.longitude) {
            this.map?.setView([data.latitude, data.longitude], 13);
            this.setLocation(data.latitude, data.longitude);
          }
        }, 0);
      },
      error: () => { this.error = '載入失敗，請重新整理'; this.loading = false; },
    });
  }

  private setLocation(lat: number, lng: number) {
    this.form.latitude = Math.round(lat * 1000000) / 1000000;
    this.form.longitude = Math.round(lng * 1000000) / 1000000;
    if (this.marker) this.marker.setLatLng([lat, lng]);
    else this.marker = L.marker([lat, lng]).addTo(this.map!);
  }

  locateByAddress() {
    if (!this.form.area.trim()) return;
    this.locating = true;
    this.error = '';
    this.campService.geocode(this.form.area).subscribe({
      next: (res) => {
        this.map?.setView([res.lat, res.lng], 15);
        this.setLocation(res.lat, res.lng);
        this.locating = false;
      },
      error: () => {
        this.error = '找不到此地址，請調整關鍵字或直接點地圖選點';
        this.locating = false;
      },
    });
  }

  fetchElevation() {
    if (!this.form.latitude || !this.form.longitude) {
      this.error = '請先選擇地址或在地圖上點選位置';
      return;
    }
    this.fetchingElevation = true;
    this.error = '';
    this.campService.elevation(this.form.latitude, this.form.longitude).subscribe({
      next: (res) => {
        this.form.elevation = Math.round(res.elevation);
        this.fetchingElevation = false;
      },
      error: () => {
        this.error = '找不到此座標的高度資料，請手動輸入';
        this.fetchingElevation = false;
      },
    });
  }

  addHighlight() {
    const text = this.highlightInput.trim();
    if (!text || this.form.highlights.length >= 3) return;
    this.form.highlights.push(text);
    this.highlightInput = '';
  }

  removeHighlight(i: number) { this.form.highlights.splice(i, 1); }

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
    this.campService.updateCampground(this.campgroundId, dto).subscribe({
      next: () => this.router.navigate(['/ownerCenter/camps']),
      error: (err) => { this.error = err.error?.message ?? '儲存失敗，請稍後再試'; this.submitting = false; },
    });
  }

  cancel() { this.router.navigate(['/ownerCenter/camps']); }
}
