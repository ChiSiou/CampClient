import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import { CampzoneCreateDto, TagDto, FacilityDto } from '../../../../interfaces/camp-management.interface';
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
  currentStep = 1;
  stepLabels = ['基本資料', '地圖圈選', '設施與標籤', '照片'];
  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  tags: TagDto[] = [];
  tagsByCategory: { category: string; items: TagDto[] }[] = [];
  facilities: FacilityDto[] = [];

  form: CampzoneCreateDto = {
    zoneName: '', zoneDescription: '', geoJson: '', zoneType: 1,
    pricing: { id: 0, weekdayPrice: 0, weekendPrice: 0 }, facilityIds: [], tagIds: [],
  };

  private existingZones: { geoJson: string; zoneName: string }[] = [];
  private mapInitialized = false;
  private campLat = 0;
  private campLng = 0;

  constructor(private route: ActivatedRoute, private router: Router, private campService: CampManagementService) {}

  ngAfterViewInit() {
    this.campgroundId = +this.route.snapshot.paramMap.get('campId')!;

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
        this.existingZones = (data.zones ?? []).filter(z => z.geoJson).map(z => ({ geoJson: z.geoJson, zoneName: z.zoneName }));
        this.campLat = data.latitude;
        this.campLng = data.longitude;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  ngOnDestroy() { this.map?.remove(); }

  private initMap(lat: number, lng: number) {
    const center: L.LatLngExpression = lat && lng ? [lat, lng] : [23.5, 121.0];
    const zoom = lat ? 19 : 7;
    // 改用國土測繪中心（NLSC）臺灣正射影像，比 Esri 全球衛星圖在台灣鄉間/山區清晰很多
    // （實測驗證：Esri 在這類地形大多只到 18 級、超過就是固定的無資料佔位圖；NLSC 到 20 級仍是真實影像）。
    // 圈選營區範圍需要看清楚地形/建物邊界才能點得準，所以這裡的清晰度比甘特圖那邊的示意地圖更重要。
    this.map = L.map(this.mapContainer.nativeElement, { maxZoom: 21 }).setView(center, zoom);
    L.tileLayer('https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/GoogleMapsCompatible/{z}/{y}/{x}', {
      attribution: 'Tiles © 國土測繪中心 NLSC',
      maxZoom: 21,
      maxNativeZoom: 20,
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

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    this.selectedFiles.push(...files);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = (e) => this.previewUrls.push(e.target!.result as string);
      reader.readAsDataURL(f);
    });
  }

  removeFile(i: number) {
    this.selectedFiles.splice(i, 1);
    this.previewUrls.splice(i, 1);
  }

  nextStep() {
    this.error = '';
    if (this.currentStep === 1 && !this.form.zoneName.trim()) {
      this.error = '請填寫營區名稱';
      return;
    }
    if (this.currentStep === 2 && this.drawnPointCount < 3) {
      this.error = '請至少在地圖上點選 3 個點以圍出營區範圍';
      return;
    }
    this.currentStep++;
    if (this.currentStep === 2) {
      if (!this.mapInitialized) {
        this.mapInitialized = true;
        setTimeout(() => {
          this.initMap(this.campLat, this.campLng);
          this.drawExistingZones();
        }, 0);
      } else {
        setTimeout(() => this.map?.invalidateSize(), 0);
      }
    }
  }

  prevStep() {
    this.error = '';
    this.currentStep--;
  }

  async submit() {
    if (!this.form.zoneName.trim()) { this.error = '請填寫營區名稱'; return; }
    this.submitting = true;
    this.error = '';
    const dto: CampzoneCreateDto = {
      ...this.form,
      pricing: { ...this.form.pricing, weekdayPrice: +this.form.pricing.weekdayPrice || 0, weekendPrice: +this.form.pricing.weekendPrice || 0 },
    };
    try {
      const res = await this.campService.createZone(this.campgroundId, dto).toPromise();
      const id = res!.id;
      for (const file of this.selectedFiles) {
        await this.campService.uploadZonePhoto(id, file).toPromise();
      }
      this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones', id, 'sites', 'add']);
    } catch (err: any) {
      this.error = err.error?.message ?? '建立失敗';
      this.submitting = false;
    }
  }

  cancel() { this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones']); }
}
