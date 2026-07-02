import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../services/camp-management.service';
import { CampsiteListItemDto } from '../../../interfaces/camp-management.interface';

@Component({
  selector: 'app-sites',
  imports: [CommonModule, RouterLink],
  templateUrl: './sites.html',
  styleUrl: './sites.css',
})
export class Sites implements OnInit {
  campgroundId!: number;
  zoneId!: number;
  campgroundName = '';
  zoneName = '';
  sites: CampsiteListItemDto[] = [];
  loading = true;

  constructor(private route: ActivatedRoute, private campService: CampManagementService) {}

  ngOnInit() {
    this.campgroundId = +this.route.snapshot.paramMap.get('campId')!;
    this.zoneId = +this.route.snapshot.paramMap.get('zoneId')!;
    this.loadData();
  }

  private loadData() {
    this.campService.getCampground(this.campgroundId).subscribe({
      next: (data) => {
        this.campgroundName = data.name;
        const zone = (data.zones ?? []).find(z => z.id === this.zoneId);
        this.zoneName = zone?.zoneName ?? '';
      },
    });
    this.campService.listSites(this.zoneId).subscribe({
      next: (sites) => { this.sites = sites; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  refresh() {
    this.campService.listSites(this.zoneId).subscribe({ next: (sites) => this.sites = sites });
  }

  delete(siteId: number, siteNumber: string) {
    if (!confirm(`確定要刪除營位「${siteNumber}」嗎？`)) return;
    this.campService.deleteSite(siteId).subscribe({
      next: () => this.refresh(),
      error: (err) => alert(err.error?.message ?? '刪除失敗'),
    });
  }

  siteStatusName(status: number) { return status === 1 ? '正常' : '維護中'; }
}
