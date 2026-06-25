import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { Skeleton } from 'primeng/skeleton';
import { AttractionService } from '../../services/attraction.service';
import { AttractionDetailDto } from '../../interfaces/attraction.interface';
import { NearbyCampItem } from '../../interfaces/camp.interface';
import { NearbyCampCard } from '../shared/nearby-camp-card/nearby-camp-card';
import { Lightbox } from '../shared/lightbox/lightbox';

@Component({
  selector: 'app-attraction-detail',
  imports: [RouterLink, DecimalPipe, Skeleton, NearbyCampCard, Lightbox],
  templateUrl: './attraction-detail.html',
  styleUrl: './attraction-detail.css',
})
export class AttractionDetail implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('attractionMap') mapEl!: ElementRef<HTMLDivElement>;

  detail: AttractionDetailDto | null = null;
  loading = true;
  error = false;
  showLightbox = false;
  lightboxIndex = 0;

  private map?: L.Map;
  private campMarkers = new Map<number, L.Marker>();
  private mapReady = false;
  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attractionService: AttractionService,
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.loading = true;
      this.error = false;
      this.detail = null;
      this.showLightbox = false;
      this.lightboxIndex = 0;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.attractionService.getDetail(id).subscribe({
        next: data => {
          this.detail = data;
          this.loading = false;
          if (this.mapReady) this.updateMap();
        },
        error: () => {
          this.loading = false;
          this.error = true;
        },
      });
    });
  }

  ngAfterViewInit() {
    this.initMap();
    this.mapReady = true;
    if (this.detail) this.updateMap();
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.map?.remove();
  }

  private initMap() {
    if (!this.mapEl?.nativeElement) return;
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    this.map = L.map(this.mapEl.nativeElement).setView([23.5, 121], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
    }).addTo(this.map);
  }

  private updateMap() {
    if (!this.map || !this.detail) return;
    const { latitude: lat, longitude: lng } = this.detail;

    setTimeout(() => {
      this.map!.invalidateSize();

      // 10km 範圍圈
      L.circle([lat, lng], {
        radius: 10000,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.05,
        weight: 1.5,
      }).addTo(this.map!);

      // 景點主標記
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: `<div class="map-pin map-pin--attraction-main">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 20l5-10 4 5 3-7 6 12H3z"/>
            </svg>
            ${this.detail!.attractionName}
          </div>`,
          iconSize: [160, 32],
          iconAnchor: [80, 16],
        }),
      }).addTo(this.map!);

      // 附近營區標記
      this.campMarkers.clear();
      const bounds: L.LatLngTuple[] = [[lat, lng]];
      this.detail!.nearbyCamps.forEach(camp => {
        bounds.push([camp.latitude, camp.longitude]);
        const marker = L.marker([camp.latitude, camp.longitude], {
          icon: L.divIcon({
            className: '',
            html: `<div class="map-pin map-pin--price">NT$${Math.round(camp.basePrice).toLocaleString()}</div>`,
            iconSize: [90, 28],
            iconAnchor: [45, 14],
          }),
        })
          .bindPopup(`<div class="mp-popup">
            ${camp.coverImageUrl ? `<img src="${camp.coverImageUrl}" class="mp-popup__img" />` : ''}
            <div class="mp-popup__name">${camp.name}</div>
            <div class="mp-popup__meta">${camp.distanceKm.toFixed(1)} km &nbsp;★ ${camp.averageRating.toFixed(1)}</div>
            <div class="mp-popup__price">起 NT$${Math.round(camp.basePrice).toLocaleString()}</div>
            <div class="mp-popup__link" data-camp-id="${camp.id}">查看營區 →</div>
          </div>`, { maxWidth: 200 })
          .on('popupopen', () => {
            setTimeout(() => {
              const el = document.querySelector(`.mp-popup__link[data-camp-id="${camp.id}"]`);
              el?.addEventListener('click', () => this.router.navigate(['/camp', camp.id]));
            }, 0);
          })
          .addTo(this.map!);
        this.campMarkers.set(camp.id, marker);
      });

      // 自動縮放包含所有標記
      if (bounds.length > 1) {
        this.map!.fitBounds(bounds, { padding: [40, 40] });
      } else {
        this.map!.setView([lat, lng], 13);
      }
    }, 0);
  }

  get coverImage(): string {
    return this.detail?.photoUrls[0] ?? '';
  }

  get googleMapsNavUrl(): string {
    if (!this.detail) return '#';
    return `https://www.google.com/maps/dir/?api=1&destination=${this.detail.latitude},${this.detail.longitude}&travelmode=driving`;
  }

  get nearbyCamps(): NearbyCampItem[] {
    return this.detail?.nearbyCamps ?? [];
  }

  openLightbox(index: number) {
    this.lightboxIndex = index;
    this.showLightbox = true;
  }

  onCampCardEnter(campId: number) {
    this.campMarkers.get(campId)?.openPopup();
  }

  onCampCardLeave() {
    this.map?.closePopup();
  }
}
