import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { CampCard } from '../shared/camp-card/camp-card';
import { SearchBar, SearchBarInitial } from '../shared/search-bar/search-bar';
import { SearchFilters } from '../shared/search-filters/search-filters';
import { SearchService } from '../../services/search.service';
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
export class Search implements OnInit {
  results: CampSearchResultDto[] = [];
  markers: CampMapMarkerDto[] = [];
  totalCount = 0;
  loading = true;

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
      });
    });
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
      pageNumber: params['pageNumber'] ? Number(params['pageNumber']) : 1,
      pageSize: params['pageSize'] ? Number(params['pageSize']) : 20,
    };
  }

  onSortChange() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sortBy: this.sortBy, pageNumber: 1 },
      queryParamsHandling: 'merge',
    });
  }

  onPageChange(event: PaginatorState) {
    const pageNumber = (event.page ?? 0) + 1;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pageNumber },
      queryParamsHandling: 'merge',
    });
  }
}
