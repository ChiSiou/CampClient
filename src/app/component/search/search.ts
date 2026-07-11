import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { CampCard } from '../shared/camp-card/camp-card';
import { SearchBar, SearchBarInitial } from '../shared/search-bar/search-bar';
import { SearchFilters } from '../shared/search-filters/search-filters';
import { SearchService } from '../../services/search.service';
import { TENT_ICON_SVG } from '../../shared/map-icons';
import { environment } from '../../../environments/environment';
import {
  CampSearchRequest,
  CampSearchResultDto,
  CampMapMarkerDto,
  RequirementItem,
} from '../../interfaces/camp.interface';

@Component({
  selector: 'app-search',
  imports: [CampCard, SearchBar, SearchFilters, FormsModule, SelectModule, PaginatorModule],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search implements OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  private map!: L.Map;
  private clusterGroup!: L.MarkerClusterGroup;
  private markersByCampId = new Map<number, L.Marker>();

  results: CampSearchResultDto[] = [];
  markers: CampMapMarkerDto[] = [];
  totalCount = 0;
  loading = true;

  private readonly apiHost = environment.apiUrl.replace('/api', '');

  pageSize = 20;
  pageNumber = 1;

  searchBarInitial: SearchBarInitial = {};
  initialTagIds: number[] = [];
  initialFacilityIds: number[] = [];
  initialMinElevation?: number;
  initialMinRating?: number;

  sortBy: CampSearchRequest['sortBy'] = 'Recommended';
  sortOptions = [
    { label: '推薦排序', value: 'Recommended' },
    { label: '價格：低到高', value: 'PriceAsc' },
    { label: '價格：高到低', value: 'PriceDesc' },
    { label: '評分最高', value: 'RatingDesc' },
    { label: '海拔：低到高', value: 'ElevationAsc' },
    { label: '海拔：高到低', value: 'ElevationDesc' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private searchService: SearchService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const request = this.buildRequest(params);

      this.searchBarInitial = {
        area: request.area,
        checkInDate: request.checkInDate,
        checkOutDate: request.checkOutDate,
        requirements: request.requirements,
      };
      this.initialTagIds = request.tagIds ?? [];
      this.initialFacilityIds = request.facilityIds ?? [];
      this.initialMinElevation = request.minElevation;
      this.initialMinRating = request.minRating;
      this.sortBy = request.sortBy;
      this.pageNumber = request.pageNumber ?? 1;
      this.pageSize = request.pageSize ?? 20;

      this.loading = true;
      this.searchService.search(request).subscribe(res => {
        this.results = res.results;
        this.totalCount = res.totalCount;
        this.loading = false;
      });
      this.searchService.searchMap(request).subscribe(res => {
        this.markers = res.markers ?? [];
        this.renderMarkers();
      });
    });
  }

  async ngAfterViewInit() {
    await import('leaflet.markercluster');

    // Icon.Default 內部的 _getIconUrl 永遠會自動加上偵測到的 imagePath 前綴（造成 /media/ 那段）
    // 刪掉這個覆寫方法，讓它改用 Icon 原本單純回傳 options.xxxUrl 的版本，不會加前綴
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/assets/leaflet/marker-icon-2x.png',
      iconUrl: '/assets/leaflet/marker-icon.png',
      shadowUrl: '/assets/leaflet/marker-shadow.png',
    });

    // 台灣中心點，縮放層級 7 大概可以看到整個台灣
    this.map = L.map(this.mapContainer.nativeElement).setView([23.6978, 120.9605], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.clusterGroup = L.markerClusterGroup();
    this.map.addLayer(this.clusterGroup);

    // 地圖比 API 回應慢初始化時，先補畫一次已經拿到的 markers
    this.renderMarkers();

    // 拖拉/縮放結束後（不是過程中，moveend 天然有節流效果）才同步查詢範圍
    this.map.on('moveend', () => this.onMapMoveEnd());
  }

  private onMapMoveEnd() {
    const bounds = this.map.getBounds();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        southWestLat: bounds.getSouth(),
        southWestLng: bounds.getWest(),
        northEastLat: bounds.getNorth(),
        northEastLng: bounds.getEast(),
        zoom: this.map.getZoom(),
        pageNumber: 1,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  // 營區圖示：綠色圓底 + 帳篷 icon。之後加景點標記時，複製這個寫法換顏色/換 SVG 即可
  // className 留空交給 Leaflet 控制定位用的外層元素，旋轉/造型全部包在內層 .camp-marker-pin，
  // 避免我們的 CSS transform 跟 Leaflet 用來定位圖示的 inline transform 互相覆蓋
  private campIcon = L.divIcon({
    className: 'camp-marker-icon',
    html: `<div class="camp-marker-pin">${TENT_ICON_SVG}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32], // 圖示底部尖角對齊實際座標點
    popupAnchor: [0, -32],
  });

  private renderMarkers() {
    if (!this.clusterGroup) return; // 地圖還沒初始化完成，先跳過，等 ngAfterViewInit 補畫

    this.clusterGroup.clearLayers();
    this.markersByCampId.clear();

    this.markers.forEach(m => {
      const marker = L.marker([m.latitude, m.longitude], { icon: this.campIcon });
      marker.bindPopup(this.buildPopupHtml(m), { maxWidth: 220, minWidth: 220, className: 'camp-popup' });
      this.clusterGroup.addLayer(marker);
      this.markersByCampId.set(m.id, marker);
    });
  }

  private resolveImageUrl(imageUrl: string | null | undefined): string | null {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    if (imageUrl.startsWith('/')) return `${this.apiHost}${imageUrl}`;
    return imageUrl;
  }

  private buildPopupHtml(m: CampMapMarkerDto): string {
    const cover = this.resolveImageUrl(m.coverImageUrl) || 'assets/placeholder.jpg';
    return `
      <a href="/camp/${m.id}" class="camp-popup__card">
        <div class="camp-popup__img-wrap">
          <img src="${cover}" alt="${m.name}" class="camp-popup__img" />
          <span class="camp-popup__badge">露營</span>
        </div>
        <div class="camp-popup__body">
          <div class="camp-popup__name">${m.name}</div>
          <div class="camp-popup__area">${m.area}</div>
          <div class="camp-popup__footer">
            <span class="camp-popup__rating">★ ${m.averageRating.toFixed(1)} (${m.reviewCount})</span>
            <span class="camp-popup__price">NT$ ${m.basePrice} <small>/晚</small></span>
          </div>
        </div>
      </a>
    `;
  }

  onCardHover(campId: number) {
    const marker = this.markersByCampId.get(campId);
    if (!marker) return;

    // 不主動移動/縮放地圖，只凸顯「目前畫面上看得到的東西」
    // 如果該 marker 被群聚收起來，getVisibleParent 回傳的會是代表它的那個群聚圓圈
    const visible = this.clusterGroup.getVisibleParent(marker);
    const el = visible?.getElement();
    el?.classList.add('marker--highlight');
    // z-index 要設在外層容器（leaflet-marker-pane 用 z-index 排疊層），不然放大後可能被旁邊的圖釘蓋住
    if (el) el.style.zIndex = '1000';

    // 只有「該 marker 本身就是可見的」才開 popup；如果它被群聚收起來，
    // visible 會是代表它的群聚圓圈而不是這個 marker 本身，硬開會顯示錯的內容，所以跳過
    if (visible === marker) {
      marker.openPopup();
    }
  }

  onCardHoverEnd(campId: number) {
    const marker = this.markersByCampId.get(campId);
    if (!marker) return;

    const visible = this.clusterGroup.getVisibleParent(marker);
    const el = visible?.getElement();
    el?.classList.remove('marker--highlight');
    if (el) el.style.zIndex = '';
    marker.closePopup();
  }

  private buildRequest(params: Record<string, string>): CampSearchRequest {
    let requirements: RequirementItem[] = [];
    if (params['requirements']) {
      try {
        requirements = JSON.parse(params['requirements']);
      } catch {
        requirements = [];
      }
    }

    return {
      keyword: params['keyword'] || undefined,
      area: params['area'] || undefined,
      checkInDate: params['checkInDate'] || undefined,
      checkOutDate: params['checkOutDate'] || undefined,
      sortBy: (params['sortBy'] as CampSearchRequest['sortBy']) || 'Recommended',
      requirements,
      tagIds: params['tagIds'] ? params['tagIds'].split(',').map(Number) : undefined,
      facilityIds: params['facilityIds'] ? params['facilityIds'].split(',').map(Number) : undefined,
      minElevation: params['minElevation'] ? Number(params['minElevation']) : undefined,
      minRating: params['minRating'] ? Number(params['minRating']) : undefined,
      southWestLat: params['southWestLat'] ? Number(params['southWestLat']) : undefined,
      southWestLng: params['southWestLng'] ? Number(params['southWestLng']) : undefined,
      northEastLat: params['northEastLat'] ? Number(params['northEastLat']) : undefined,
      northEastLng: params['northEastLng'] ? Number(params['northEastLng']) : undefined,
      zoom: params['zoom'] ? Number(params['zoom']) : undefined,
      pageNumber: params['pageNumber'] ? Number(params['pageNumber']) : 1,
      pageSize: params['pageSize'] ? Number(params['pageSize']) : 20,
    };
  }

  onSortChange() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sortBy: this.sortBy, pageNumber: 1 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onPageChange(event: PaginatorState) {
    const pageNumber = (event.page ?? 0) + 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pageNumber },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
