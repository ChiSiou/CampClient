import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import { CampzoneCreateDto } from '../../../../interfaces/camp-management.interface';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

@Component({
  selector: 'app-zone-add',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './zone-add.html',
  styleUrl: './zone-add.css',
})
export class ZoneAdd implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map?: L.Map;
  private drawnPoints: L.LatLng[] = [];
  private polyline?: L.Polyline;
  private polygon?: L.Polygon;

  campgroundId!: number;
  campgroundName = '';
  loading = true;
  submitting = false;
  error = '';

  form: CampzoneCreateDto = {
    zoneName: '', zoneDescription: '', geoJson: '', zoneType: 1,
    pricing: { id: 0, weekdayPrice: 0, weekendPrice: 0 }, facilityIds: [],
  };

  private existingZones: { geoJson: string; zoneName: string }[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private campService: CampManagementService) {}

  ngAfterViewInit() {
    this.campgroundId = +this.route.snapshot.paramMap.get('campId')!;
    this.campService.getCampground(this.campgroundId).subscribe({
      next: (data) => {
        this.campgroundName = data.name;
        this.existingZones = (data.zones ?? []).filter(z => z.geoJson).map(z => ({ geoJson: z.geoJson, zoneName: z.zoneName }));
        this.loading = false;
        setTimeout(() => {
          this.initMap(data.latitude, data.longitude);
          this.drawExistingZones();
        }, 0);
      },
      error: () => { this.loading = false; },
    });
  }

  ngOnDestroy() { this.map?.remove(); }

  private initMap(lat: number, lng: number) {
    const center: L.LatLngExpression = lat && lng ? [lat, lng] : [23.5, 121.0];
    const zoom = lat ? 15 : 7;
    this.map = L.map(this.mapContainer.nativeElement).setView(center, zoom);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
    }).addTo(this.map);
    this.map.on('click', (e: L.LeafletMouseEvent) => { this.drawnPoints.push(e.latlng); this.updateDrawing(); });
    setTimeout(() => this.map?.invalidateSize(), 100);
  }

  private drawExistingZones() {
    this.existingZones.forEach(z => {
      try {
        L.geoJSON(JSON.parse(z.geoJson), { style: { color: '#fff', weight: 2, fillColor: '#aaa', fillOpacity: 0.35 } })
          .bindTooltip(z.zoneName, { sticky: true }).addTo(this.map!);
      } catch {}
    });
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
    this.campService.createZone(this.campgroundId, dto).subscribe({
      next: () => this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones']),
      error: (err) => { this.error = err.error?.message ?? '建立失敗'; this.submitting = false; },
    });
  }

  cancel() { this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones']); }
}
