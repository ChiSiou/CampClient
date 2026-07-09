import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import { CampzoneCreateDto, TagDto, FacilityDto } from '../../../../interfaces/camp-management.interface';
import { PhotoGallery } from '../../shared/photo-gallery/photo-gallery';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

@Component({
  selector: 'app-zone-edit',
  imports: [CommonModule, FormsModule, RouterLink, PhotoGallery],
  templateUrl: './zone-edit.html',
  styleUrl: './zone-edit.css',
})
export class ZoneEdit implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map?: L.Map;
  private drawnPoints: L.LatLng[] = [];
  private polyline?: L.Polyline;
  private polygon?: L.Polygon;

  campgroundId!: number;
  zoneId!: number;
  campgroundName = '';
  zoneName = '';
  loading = true;
  submitting = false;
  error = '';

  tags: TagDto[] = [];
  tagsByCategory: { category: string; items: TagDto[] }[] = [];
  facilities: FacilityDto[] = [];

  form: CampzoneCreateDto = {
    zoneName: '', zoneDescription: '', geoJson: '', zoneType: 1,
    pricing: { id: 0, weekdayPrice: 0, weekendPrice: 0 }, facilityIds: [], tagIds: [],
  };

  private otherZones: { geoJson: string; zoneName: string }[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private campService: CampManagementService) {}

  ngAfterViewInit() {
    this.campgroundId = +this.route.snapshot.paramMap.get('campId')!;
    this.zoneId = +this.route.snapshot.paramMap.get('zoneId')!;

    this.campService.getFacilities().subscribe({ next: (f) => this.facilities = f });
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

    this.campService.getCampground(this.campgroundId).subscribe({
      next: (data) => {
        this.campgroundName = data.name;
        const zone = (data.zones ?? []).find(z => z.id === this.zoneId);
        if (!zone) { this.error = '找不到此營區'; this.loading = false; return; }
        this.zoneName = zone.zoneName;
        this.form = {
          zoneName: zone.zoneName,
          zoneDescription: zone.zoneDescription,
          geoJson: zone.geoJson,
          zoneType: zone.zoneType,
          pricing: zone.pricing ?? { id: 0, weekdayPrice: 0, weekendPrice: 0 },
          facilityIds: [...(zone.facilityIds ?? [])],
          tagIds: [...(zone.tagIds ?? [])],
        };
        this.otherZones = (data.zones ?? [])
          .filter(z => z.id !== this.zoneId && z.geoJson)
          .map(z => ({ geoJson: z.geoJson, zoneName: z.zoneName }));
        this.loading = false;
        setTimeout(() => {
          this.initMap(data.latitude, data.longitude);
          this.drawOtherZones();
          if (zone.geoJson) this.loadExistingPolygon(zone.geoJson);
        }, 0);
      },
      error: () => { this.error = '載入失敗'; this.loading = false; },
    });
  }

  ngOnDestroy() { this.map?.remove(); }

  private initMap(lat: number, lng: number) {
    const center: L.LatLngExpression = lat && lng ? [lat, lng] : [23.5, 121.0];
    // 改用國土測繪中心（NLSC）臺灣正射影像，比 Esri 全球衛星圖在台灣鄉間/山區清晰很多
    // （實測驗證：Esri 在這類地形大多只到 18 級、超過就是固定的無資料佔位圖；NLSC 到 20 級仍是真實影像）。
    this.map = L.map(this.mapContainer.nativeElement, { maxZoom: 21 }).setView(center, lat ? 15 : 7);
    L.tileLayer('https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/GoogleMapsCompatible/{z}/{y}/{x}', {
      attribution: 'Tiles © 國土測繪中心 NLSC',
      maxZoom: 21,
      maxNativeZoom: 20,
    }).addTo(this.map);
    this.map.on('click', (e: L.LeafletMouseEvent) => { this.drawnPoints.push(e.latlng); this.updateDrawing(); });
    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  private drawOtherZones() {
    this.otherZones.forEach(z => {
      try {
        L.geoJSON(JSON.parse(z.geoJson), { style: { color: '#fff', weight: 2, fillColor: '#aaa', fillOpacity: 0.35 } })
          .bindTooltip(z.zoneName, { sticky: true }).addTo(this.map!);
      } catch {}
    });
  }

  private loadExistingPolygon(geoJsonStr: string) {
    try {
      const coords: number[][] = JSON.parse(geoJsonStr).geometry?.coordinates?.[0];
      if (!coords || coords.length < 4) return;
      this.drawnPoints = coords.slice(0, -1).map(c => L.latLng(c[1], c[0]));
      this.updateDrawing();
      this.map?.fitBounds(L.latLngBounds(this.drawnPoints), { padding: [20, 20] });
    } catch {}
  }

  private updateDrawing() {
    this.polyline?.remove(); this.polygon?.remove();
    this.polyline = undefined; this.polygon = undefined;
    if (this.drawnPoints.length === 0) return;
    if (this.drawnPoints.length < 3) {
      this.polyline = L.polyline(this.drawnPoints, { color: '#ff6600', weight: 3 }).addTo(this.map!);
    } else {
      this.polygon = L.polygon(this.drawnPoints, { color: '#ff6600', weight: 3, fillColor: '#ff6600', fillOpacity: 0.25 }).addTo(this.map!);
    }
    this.generateGeoJson();
  }

  private generateGeoJson() {
    if (this.drawnPoints.length < 3) { this.form.geoJson = ''; return; }
    const ring = [...this.drawnPoints.map(p => [p.lng, p.lat]), [this.drawnPoints[0].lng, this.drawnPoints[0].lat]];
    this.form.geoJson = JSON.stringify({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} });
  }

  toggleTag(id: number) {
    const idx = this.form.tagIds.indexOf(id);
    if (idx >= 0) this.form.tagIds.splice(idx, 1);
    else this.form.tagIds.push(id);
  }
  isTagSelected(id: number) { return this.form.tagIds.includes(id); }

  toggleFacility(id: number) {
    const idx = this.form.facilityIds.indexOf(id);
    if (idx >= 0) this.form.facilityIds.splice(idx, 1);
    else this.form.facilityIds.push(id);
  }
  isFacilitySelected(id: number) { return this.form.facilityIds.includes(id); }

  get drawnPointCount() { return this.drawnPoints.length; }

  undoLastPoint() { if (this.drawnPoints.length > 0) { this.drawnPoints.pop(); this.updateDrawing(); } }

  clearDrawing() {
    this.drawnPoints = [];
    this.polyline?.remove(); this.polygon?.remove();
    this.polyline = undefined; this.polygon = undefined;
    this.form.geoJson = '';
  }

  submit() {
    if (!this.form.zoneName.trim()) { this.error = '請填寫營區名稱'; return; }
    this.submitting = true;
    this.error = '';
    const dto: CampzoneCreateDto = {
      ...this.form,
      pricing: { ...this.form.pricing, weekdayPrice: +this.form.pricing.weekdayPrice || 0, weekendPrice: +this.form.pricing.weekendPrice || 0 },
    };
    this.campService.updateZone(this.zoneId, dto).subscribe({
      next: () => this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones']),
      error: (err) => { this.error = err.error?.message ?? '儲存失敗'; this.submitting = false; },
    });
  }

  cancel() { this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones']); }
}
