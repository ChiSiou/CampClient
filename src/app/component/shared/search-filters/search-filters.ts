import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { SliderModule } from 'primeng/slider';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { SearchService } from '../../../services/search.service';
import { FilterTagItem } from '../../../interfaces/camp.interface';

@Component({
  selector: 'app-search-filters',
  templateUrl: './search-filters.html',
  styleUrl: './search-filters.css',
  imports: [FormsModule, DialogModule, SliderModule, RadioButtonModule, CheckboxModule, ButtonModule],
})
export class SearchFilters implements OnInit {
  @Input() initialTagIds: number[] = [];
  @Input() initialFacilityIds: number[] = [];
  @Input() initialMinElevation?: number;
  @Input() initialMinRating?: number;

  visible = false;

  environmentTags: FilterTagItem[] = [];
  policyTags: FilterTagItem[] = [];
  facilityTags: FilterTagItem[] = [];

  selectedTagIds = new Set<number>();
  selectedFacilityIds = new Set<number>();
  minElevation = 0;
  minRating: number | null = null;

  activeCount = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private searchService: SearchService,
  ) {}

  ngOnInit() {
    this.syncFromInitial();

    this.searchService.getFilters().subscribe(filters => {
      this.environmentTags = filters.environmentTags;
      this.policyTags = filters.policyTags;
      this.facilityTags = filters.facilityTags;
    });
  }

  private syncFromInitial() {
    this.selectedTagIds = new Set(this.initialTagIds);
    this.selectedFacilityIds = new Set(this.initialFacilityIds);
    this.minElevation = this.initialMinElevation ?? 0;
    this.minRating = this.initialMinRating ?? null;
    this.updateActiveCount();
  }

  open() {
    this.syncFromInitial();
    this.visible = true;
  }

  toggleTag(tagId: number) {
    this.selectedTagIds.has(tagId) ? this.selectedTagIds.delete(tagId) : this.selectedTagIds.add(tagId);
  }

  toggleFacility(facilityId: number) {
    this.selectedFacilityIds.has(facilityId)
      ? this.selectedFacilityIds.delete(facilityId)
      : this.selectedFacilityIds.add(facilityId);
  }

  reset() {
    this.selectedTagIds.clear();
    this.selectedFacilityIds.clear();
    this.minElevation = 0;
    this.minRating = null;
  }

  apply() {
    this.updateActiveCount();

    const params: Record<string, any> = {
      tagIds: this.selectedTagIds.size > 0 ? [...this.selectedTagIds].join(',') : null,
      facilityIds: this.selectedFacilityIds.size > 0 ? [...this.selectedFacilityIds].join(',') : null,
      minElevation: this.minElevation > 0 ? this.minElevation : null,
      minRating: this.minRating ?? null,
      pageNumber: 1,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });

    this.visible = false;
  }

  private updateActiveCount() {
    this.activeCount =
      this.selectedTagIds.size +
      this.selectedFacilityIds.size +
      (this.minElevation > 0 ? 1 : 0) +
      (this.minRating ? 1 : 0);
  }
}
