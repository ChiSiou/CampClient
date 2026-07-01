import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import {
  CampgroundCreateDto,
  CampzoneCreateDto,
  CampzoneListItemDto,
} from '../../../../interfaces/camp-management.interface';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

@Component({
  selector: 'app-camp-edit',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './camp-edit.html',
  styleUrl: './camp-edit.css',
})
export class CampEdit implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @ViewChild('zoneMapContainer') zoneMapContainer?: ElementRef;

  // ── 主地圖（Campground 位置） ──
  private map?: L.Map;
  private marker?: L.Marker;

  // ── Zone 地圖（畫多邊形） ──
  private zoneMap?: L.Map;
  private drawnPoints: L.LatLng[] = [];
  private zonePolyline?: L.Polyline;
  private zonePolygon?: L.Polygon;

  campgroundId!: number;
  campgroundName = '';
  campgroundStatus = 0;
  loading = true;
  submitting = false;
  locating = false;
  error = '';
  highlightInput = '';

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
    highlights: [],
    facilityIds: [],
    tagIds: [],
  };

  // ── Zone 狀態 ──
  zones: CampzoneListItemDto[] = [];
  showZoneModal = false;
  editingZoneId: number | null = null;
  zoneSubmitting = false;
  zoneError = '';
  zoneForm: CampzoneCreateDto = this.emptyZoneForm();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campService: CampManagementService
  ) {}

  ngAfterViewInit() {
    this.campgroundId = +this.route.snapshot.paramMap.get('id')!;
    this.loadCampground();
  }

  ngOnDestroy() {
    this.map?.remove();
    this.zoneMap?.remove();
  }

  // ── 主地圖 ────────────────────────────────────────────────

  private initMap() {
    this.map = L.map(this.mapContainer.nativeElement).setView([23.5, 121.0], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  private loadCampground() {
    this.campService.getCampground(this.campgroundId).subscribe({
      next: (data) => {
        this.campgroundName = data.name;
        this.campgroundStatus = data.status;
        this.form = {
          name: data.name,
          phone: data.phone,
          elevation: data.elevation,
          description: data.description,
          website: data.website,
          basePrice: data.basePrice,
          area: data.area,
          latitude: data.latitude,
          longitude: data.longitude,
          rules: data.rules,
          highlights: [...data.highlights],
          facilityIds: [...data.facilityIds],
          tagIds: [...data.tagIds],
        };
        this.zones = data.zones ?? [];
        this.loading = false;
        setTimeout(() => {
          this.initMap();
          if (data.latitude && data.longitude) {
            this.map?.setView([data.latitude, data.longitude], 13);
            this.setLocation(data.latitude, data.longitude);
          }
        }, 0);
      },
      error: () => {
        this.error = '載入失敗，請重新整理';
        this.loading = false;
      },
    });
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

  addHighlight() {
    const text = this.highlightInput.trim();
    if (!text || this.form.highlights.length >= 3) return;
    this.form.highlights.push(text);
    this.highlightInput = '';
  }

  removeHighlight(i: number) {
    this.form.highlights.splice(i, 1);
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
    this.campService.updateCampground(this.campgroundId, dto).subscribe({
      next: () => this.router.navigate(['/ownerCenter/camps']),
      error: (err) => {
        this.error = err.error?.message ?? '儲存失敗，請稍後再試';
        this.submitting = false;
      },
    });
  }

  cancel() {
    this.router.navigate(['/ownerCenter/camps']);
  }

  // ── Zone CRUD ─────────────────────────────────────────────

  private emptyZoneForm(): CampzoneCreateDto {
    return {
      zoneName: '',
      zoneDescription: '',
      geoJson: '',
      zoneType: 0,
      pricing: { id: 0, weekdayPrice: 0, weekendPrice: 0 },
      facilityIds: [],
    };
  }

  openAddZone() {
    this.editingZoneId = null;
    this.zoneForm = this.emptyZoneForm();
    this.zoneError = '';
    this.drawnPoints = [];
    this.showZoneModal = true;
    setTimeout(() => this.initZoneMap(), 0);
  }

  openEditZone(zone: CampzoneListItemDto) {
    this.editingZoneId = zone.id;
    this.zoneForm = {
      zoneName: zone.zoneName,
      zoneDescription: zone.zoneDescription,
      geoJson: zone.geoJson,
      zoneType: zone.zoneType,
      pricing: zone.pricing ?? { id: 0, weekdayPrice: 0, weekendPrice: 0 },
      facilityIds: [],
    };
    this.zoneError = '';
    this.drawnPoints = [];
    this.showZoneModal = true;
    setTimeout(() => {
      this.initZoneMap();
      if (zone.geoJson) this.loadExistingGeoJson(zone.geoJson);
    }, 0);
  }

  closeZoneModal() {
    this.showZoneModal = false;
    this.zoneMap?.remove();
    this.zoneMap = undefined;
  }

  submitZone() {
    if (!this.zoneForm.zoneName.trim()) {
      this.zoneError = '請填寫營區名稱';
      return;
    }
    this.zoneSubmitting = true;
    this.zoneError = '';
    const dto: CampzoneCreateDto = {
      ...this.zoneForm,
      pricing: {
        ...this.zoneForm.pricing,
        weekdayPrice: +this.zoneForm.pricing.weekdayPrice || 0,
        weekendPrice: +this.zoneForm.pricing.weekendPrice || 0,
      },
    };

    const req = this.editingZoneId
      ? this.campService.updateZone(this.editingZoneId, dto)
      : this.campService.createZone(this.campgroundId, dto);

    req.subscribe({
      next: () => {
        this.closeZoneModal();
        this.zoneSubmitting = false;
        this.refreshZones();
      },
      error: (err) => {
        this.zoneError = err.error?.message ?? '儲存失敗';
        this.zoneSubmitting = false;
      },
    });
  }

  deleteZone(zoneId: number) {
    if (!confirm('確定要刪除此營區嗎？底下不能有任何營位。')) return;
    this.campService.deleteZone(zoneId).subscribe({
      next: () => this.refreshZones(),
      error: (err) => alert(err.error?.message ?? '刪除失敗'),
    });
  }

  private refreshZones() {
    this.campService.listZones(this.campgroundId).subscribe({
      next: (zones) => (this.zones = zones),
    });
  }

  zoneTypeName(type: number) {
    return type === 0 ? '自帶露營裝備' : '園區住宿';
  }

  get drawnPointCount() {
    return this.drawnPoints.length;
  }

  // ── Zone 地圖：打點畫多邊形 ───────────────────────────────

  private initZoneMap() {
    if (!this.zoneMapContainer) return;
    if (this.zoneMap) { this.zoneMap.remove(); this.zoneMap = undefined; }

    const center: L.LatLngExpression =
      this.form.latitude && this.form.longitude
        ? [this.form.latitude, this.form.longitude]
        : [23.5, 121.0];
    const zoom = this.form.latitude ? 14 : 7;

    this.zoneMap = L.map(this.zoneMapContainer.nativeElement).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.zoneMap);

    this.zoneMap.on('click', (e: L.LeafletMouseEvent) => {
      this.drawnPoints.push(e.latlng);
      this.updateDrawing();
    });

    setTimeout(() => this.zoneMap?.invalidateSize(), 100);
  }

  private loadExistingGeoJson(geojsonStr: string) {
    try {
      const geojson = JSON.parse(geojsonStr);
      const coords: number[][] = geojson.geometry?.coordinates?.[0];
      if (!coords || coords.length < 4) return;
      // GeoJSON polygon 最後一個點跟第一個點相同，slice 掉
      this.drawnPoints = coords.slice(0, -1).map((c) => L.latLng(c[1], c[0]));
      this.updateDrawing();
      const bounds = L.latLngBounds(this.drawnPoints);
      this.zoneMap?.fitBounds(bounds, { padding: [20, 20] });
    } catch {}
  }

  private updateDrawing() {
    this.zonePolyline?.remove();
    this.zonePolygon?.remove();
    this.zonePolyline = undefined;
    this.zonePolygon = undefined;

    if (this.drawnPoints.length === 0) return;

    const style = { color: '#4a7c59', weight: 2 };

    if (this.drawnPoints.length < 3) {
      this.zonePolyline = L.polyline(this.drawnPoints, style).addTo(this.zoneMap!);
    } else {
      this.zonePolygon = L.polygon(this.drawnPoints, {
        ...style,
        fillColor: '#4a7c59',
        fillOpacity: 0.2,
      }).addTo(this.zoneMap!);
    }

    this.generateGeoJson();
  }

  private generateGeoJson() {
    if (this.drawnPoints.length < 3) {
      this.zoneForm.geoJson = '';
      return;
    }
    const ring = [
      ...this.drawnPoints.map((p) => [p.lng, p.lat]),
      [this.drawnPoints[0].lng, this.drawnPoints[0].lat],
    ];
    this.zoneForm.geoJson = JSON.stringify({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [ring] },
      properties: {},
    });
  }

  clearDrawing() {
    this.drawnPoints = [];
    this.zonePolyline?.remove();
    this.zonePolygon?.remove();
    this.zonePolyline = undefined;
    this.zonePolygon = undefined;
    this.zoneForm.geoJson = '';
  }

  undoLastPoint() {
    if (this.drawnPoints.length === 0) return;
    this.drawnPoints.pop();
    this.updateDrawing();
  }
}
