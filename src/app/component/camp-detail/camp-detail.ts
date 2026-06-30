import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import * as L from 'leaflet';
import { Skeleton } from 'primeng/skeleton';
import { CampDetailService } from '../../services/camp-detail.service';
import { ExplorationService } from '../../services/exploration.service';
import { CampSelectionService } from '../../services/camp-selection.service';
import { PaymentService } from '../../services/payment.service';
import { Review } from '../reviews/review/review';
import { NearbyCampCard } from '../shared/nearby-camp-card/nearby-camp-card';
import { Lightbox } from '../shared/lightbox/lightbox';
import { GanttCalendar } from './gantt-calendar/gantt-calendar';
import {
  CampDetailDto,
  CampLocationDto,
  CampExplorationDto,
  CampMapZoneDto,
  NearbyCampItem,
  NearbyAttractionItem,
  RefundPolicyDto,
  RefundTierItem,
} from '../../interfaces/camp.interface';

import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-camp-detail',
  imports: [RouterLink, DecimalPipe, Skeleton, Review, NearbyCampCard, Lightbox, GanttCalendar],
  templateUrl: './camp-detail.html',
  styleUrl: './camp-detail.css',
})
export class CampDetail implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('exploreMap') mapEl!: ElementRef<HTMLDivElement>;

  campId = 0;
  detail: CampDetailDto | null = null;
  location: CampLocationDto | null = null;
  explore: CampExplorationDto | null = null;
  zones: CampMapZoneDto[] = [];
  refundPolicy: RefundPolicyDto | null = null;
  loading = true;
  error = false;

  showLightbox = false;
  lightboxIndex = 0;

  private map?: L.Map;
  private campMarkers = new Map<number, L.Marker>();
  private attractionMarkers = new Map<number, L.Marker>();
  private mapReady = false;
  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campDetailService: CampDetailService,
    private explorationService: ExplorationService,
    private campSelectionService: CampSelectionService,
    private chatService: ChatService,
    private paymentService: PaymentService,
  ) { }


  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.campId = Number(params.get('id'));
      this.campSelectionService.setCampground(this.campId);
      this.resetState();
      this.loadData();
      if (this.mapReady) this.resetMap();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 取消政策是全平台共用的設定，跟營區無關，只要載入一次
    this.paymentService.getRefundPolicy().subscribe({
      next: res => (this.refundPolicy = res),
      error: () => { },
    });
  }

  ngAfterViewInit() {
    this.initMap();
    this.mapReady = true;
    // 極快網路時資料可能比 AfterViewInit 先到
    if (this.location) this.updateMapMarkers();
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.map?.remove();
  }

  private resetState() {
    this.detail = null;
    this.location = null;
    this.explore = null;
    this.zones = [];
    this.loading = true;
    this.error = false;
    this.showLightbox = false;
    this.lightboxIndex = 0;
  }

  private resetMap() {
    this.map?.remove();
    this.map = undefined;
    this.initMap();
  }

  private loadData() {
    forkJoin({
      detail: this.campDetailService.getDetail(this.campId),
      location: this.campDetailService.getLocation(this.campId),
      explore: this.explorationService.getCampground(this.campId),
      zones: this.campDetailService.getZones(this.campId),
    }).subscribe({
      next: ({ detail, location, explore, zones }) => {
        this.detail = detail;
        this.location = location;
        this.explore = explore;
        this.zones = zones;
        this.loading = false;
        if (this.mapReady) this.updateMapMarkers();
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  // 標籤依 Category 分組顯示（環境特色 vs 政策規則），不要混在一起
  get environmentTags() {
    return this.detail?.tags.filter(t => t.category === 'Environment') ?? [];
  }

  get policyTags() {
    return this.detail?.tags.filter(t => t.category === 'Policy') ?? [];
  }

  // 封面大圖：最多取前 5 張（index 0 = 大圖，1-4 = 右側小圖）
  get gridImages(): string[] {
    return this.detail?.imageUrls.slice(0, 5) ?? [];
  }

  get smallImages(): string[] {
    return this.gridImages.slice(1);
  }

  get nearbyCamps(): NearbyCampItem[] {
    return this.explore?.nearbyCamps ?? [];
  }

  get nearbyAttractions(): NearbyAttractionItem[] {
    return this.explore?.nearbyAttractions ?? [];
  }

  openLightbox(index: number) {
    this.lightboxIndex = index;
    this.showLightbox = true;
  }

  onCampCardEnter(campId: number) {
    this.campMarkers.get(campId)?.openPopup();
  }

  onAttractionCardEnter(attrId: number) {
    this.attractionMarkers.get(attrId)?.openPopup();
  }

  onCardLeave() {
    this.map?.closePopup();
  }

  // 把 minDaysBeforeCheckIn/maxDaysBeforeCheckIn 轉成「入住前 X~Y 天」之類的文字，
  // 不然光看退款比例完全看不出來這個級距是什麼時候適用的
  tierRangeLabel(tier: RefundTierItem): string {
    const { minDaysBeforeCheckIn: min, maxDaysBeforeCheckIn: max } = tier;
    if (max === null) return `入住前 ${min} 天以上`;
    if (min === 0) return `入住前 ${max} 天內`;
    return `入住前 ${min}~${max} 天`;
  }

  get googleMapsNavUrl(): string {
    if (!this.location) return '#';
    const { targetLatitude: lat, targetLongitude: lng } = this.location;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  }

  private initMap() {
    if (!this.mapEl?.nativeElement) return;
    // 防止 Leaflet 預設 icon 路徑問題（見 PROGRESS.md Leaflet 章節）
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    this.map = L.map(this.mapEl.nativeElement).setView([23.5, 121], 8);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
    }).addTo(this.map);
  }

  private updateMapMarkers() {
    if (!this.map || !this.location) return;

    const { targetLatitude: lat, targetLongitude: lng } = this.location;
    this.map.setView([lat, lng], 11);

    // 10km 圓圈
    L.circle([lat, lng], {
      radius: 10000,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.05,
      weight: 1.5,
    }).addTo(this.map);

    // 本營區主標記
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: `<div class="map-pin map-pin--main">${this.detail?.name ?? '本營區'}</div>`,
        iconSize: [140, 30],
        iconAnchor: [70, 15],
      }),
    }).addTo(this.map);

    // 附近營區：白底價格標籤
    this.campMarkers.clear();
    this.explore?.nearbyCamps.forEach(camp => {
      const marker = L.marker([camp.latitude, camp.longitude], {
        icon: L.divIcon({
          className: '',
          html: `<div class="map-pin map-pin--price">NT$${Math.round(camp.basePrice).toLocaleString()}</div>`,
          iconSize: [90, 28],
          iconAnchor: [45, 14],
        }),
      })
        .bindPopup(
          `<div class="mp-popup">
            ${camp.coverImageUrl ? `<img src="${camp.coverImageUrl}" class="mp-popup__img" />` : ''}
            <div class="mp-popup__name">${camp.name}</div>
            <div class="mp-popup__meta">${camp.distanceKm.toFixed(1)} km &nbsp;★ ${camp.averageRating.toFixed(1)}</div>
            <div class="mp-popup__price">起 NT$${Math.round(camp.basePrice).toLocaleString()}</div>
          </div>`,
          { maxWidth: 200 }
        )
        .addTo(this.map!);
      this.campMarkers.set(camp.id, marker);
    });

    // 附近景點：綠色圓形標記，點擊跳轉詳細頁
    this.attractionMarkers.clear();
    this.explore?.nearbyAttractions.forEach(attr => {
      const marker = L.marker([attr.latitude, attr.longitude], {
        icon: L.divIcon({
          className: '',
          html: `<div class="map-pin map-pin--attraction">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 20l5-10 4 5 3-7 6 12H3z"/>
            </svg>
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      })
        .bindPopup(`<div class="mp-popup">
            ${attr.coverImageUrl ? `<img src="${attr.coverImageUrl}" class="mp-popup__img" />` : ''}
            <div class="mp-popup__name">${attr.attractionName}</div>
            <div class="mp-popup__meta">${attr.distanceKm.toFixed(1)} km</div>
            ${attr.ticketInfo ? `<div class="mp-popup__price">${attr.ticketInfo}</div>` : ''}
            <div class="mp-popup__link" data-attr-id="${attr.id}">查看景點 →</div>
          </div>`, { maxWidth: 200 })
        .on('popupopen', () => {
          setTimeout(() => {
            const el = document.querySelector(`.mp-popup__link[data-attr-id="${attr.id}"]`);
            el?.addEventListener('click', () => this.router.navigate(['/attraction', attr.id]));
          }, 0);
        })
        .addTo(this.map!);
      this.attractionMarkers.set(attr.id, marker);
    });
  }

  contactOwner() {
    if (!this.detail) return;
    this.chatService.openChatWith(this.detail.ownerUserId, this.detail.ownerName || '營主');
  }
}
