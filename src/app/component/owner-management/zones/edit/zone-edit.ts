import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import { CampzoneCreateDto } from '../../../../interfaces/camp-management.interface';
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

  form: CampzoneCreateDto = {
    zoneName: '', zoneDescription: '', geoJson: '', zoneType: 1,
    pricing: { id: 0, weekdayPrice: 0, weekendPrice: 0 }, facilityIds: [],
  };

  private otherZones: { geoJson: string; zoneName: string }[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private campService: CampManagementService) {}

  ngAfterViewInit() {
    this.campgroundId = +this.route.snapshot.paramMap.get('campId')!;
    this.zoneId = +this.route.snapshot.paramMap.get('zoneId')!;
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
          facilityIds: [],
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
    this.map = L.map(this.mapContainer.nativeElement).setView(center, lat ? 15 : 7);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
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
