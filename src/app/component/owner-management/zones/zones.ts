import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../services/camp-management.service';
import { CampzoneListItemDto, CampzoneType } from '../../../interfaces/camp-management.interface';

@Component({
  selector: 'app-zones',
  imports: [CommonModule, RouterLink],
  templateUrl: './zones.html',
  styleUrl: './zones.css',
})
export class Zones implements OnInit {
  campgroundId!: number;
  campgroundName = '';
  zones: CampzoneListItemDto[] = [];
  loading = true;
  CampzoneType = CampzoneType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campService: CampManagementService
  ) {}

  ngOnInit() {
    this.campgroundId = +this.route.snapshot.paramMap.get('campId')!;
    this.loadData();
  }

  private loadData() {
    this.campService.getCampground(this.campgroundId).subscribe({
      next: (data) => {
        this.campgroundName = data.name;
        this.zones = data.zones ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  refresh() {
    this.campService.listZones(this.campgroundId).subscribe({
      next: (zones) => this.zones = zones,
    });
  }

  delete(zoneId: number, zoneName: string) {
    if (!confirm(`確定要刪除「${zoneName}」嗎？底下不能有任何營位。`)) return;
    this.campService.deleteZone(zoneId).subscribe({
      next: () => this.refresh(),
      error: (err) => alert(err.error?.message ?? '刪除失敗'),
    });
  }

  zoneTypeName(type: number) {
    return type === CampzoneType.BringOwnGear ? '自帶露營裝備' : '園區住宿';
  }
}
