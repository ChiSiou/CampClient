import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import { CampsiteUpdateDto } from '../../../../interfaces/camp-management.interface';

@Component({
  selector: 'app-site-edit',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './site-edit.html',
  styleUrl: './site-edit.css',
})
export class SiteEdit implements OnInit {
  campgroundId!: number;
  zoneId!: number;
  siteId!: number;
  campgroundName = '';
  zoneName = '';
  siteNumber = '';
  loading = true;
  submitting = false;
  error = '';

  form: CampsiteUpdateDto = { siteNumber: '', capacityPeople: 4, siteStatus: 1, description: '', facilityIds: [] };

  constructor(private route: ActivatedRoute, private router: Router, private campService: CampManagementService) {}

  ngOnInit() {
    this.campgroundId = +this.route.snapshot.paramMap.get('campId')!;
    this.zoneId = +this.route.snapshot.paramMap.get('zoneId')!;
    this.siteId = +this.route.snapshot.paramMap.get('siteId')!;

    this.campService.getCampground(this.campgroundId).subscribe({
      next: (data) => {
        this.campgroundName = data.name;
        this.zoneName = (data.zones ?? []).find(z => z.id === this.zoneId)?.zoneName ?? '';
      },
    });

    this.campService.listSites(this.zoneId).subscribe({
      next: (sites) => {
        const site = sites.find(s => s.id === this.siteId);
        if (!site) { this.error = '找不到此營位'; this.loading = false; return; }
        this.siteNumber = site.siteNumber;
        this.form = {
          siteNumber: site.siteNumber,
          capacityPeople: site.capacityPeople,
          siteStatus: site.siteStatus,
          description: site.description,
          facilityIds: [],
        };
        this.loading = false;
      },
      error: () => { this.error = '載入失敗'; this.loading = false; },
    });
  }

  submit() {
    if (!this.form.siteNumber.trim()) { this.error = '請填寫營位編號'; return; }
    this.submitting = true;
    this.error = '';
    const dto: CampsiteUpdateDto = { ...this.form, capacityPeople: +this.form.capacityPeople || 1 };
    this.campService.updateSite(this.siteId, dto).subscribe({
      next: () => this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones', this.zoneId, 'sites']),
      error: (err) => { this.error = err.error?.message ?? '儲存失敗'; this.submitting = false; },
    });
  }

  cancel() { this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones', this.zoneId, 'sites']); }
}
