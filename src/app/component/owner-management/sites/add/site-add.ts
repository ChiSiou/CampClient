import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import { CampsiteCreateDto } from '../../../../interfaces/camp-management.interface';

@Component({
  selector: 'app-site-add',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './site-add.html',
  styleUrl: './site-add.css',
})
export class SiteAdd implements OnInit {
  campgroundId!: number;
  zoneId!: number;
  campgroundName = '';
  zoneName = '';
  submitting = false;
  error = '';

  form: CampsiteCreateDto = { siteNumber: '', capacityPeople: 4, description: '', facilityIds: [] };

  constructor(private route: ActivatedRoute, private router: Router, private campService: CampManagementService) {}

  ngOnInit() {
    this.campgroundId = +this.route.snapshot.paramMap.get('campId')!;
    this.zoneId = +this.route.snapshot.paramMap.get('zoneId')!;
    this.campService.getCampground(this.campgroundId).subscribe({
      next: (data) => {
        this.campgroundName = data.name;
        this.zoneName = (data.zones ?? []).find(z => z.id === this.zoneId)?.zoneName ?? '';
      },
    });
  }

  submit() {
    if (!this.form.siteNumber.trim()) { this.error = '請填寫營位編號'; return; }
    this.submitting = true;
    this.error = '';
    const dto: CampsiteCreateDto = { ...this.form, capacityPeople: +this.form.capacityPeople || 1 };
    this.campService.createSite(this.zoneId, dto).subscribe({
      next: () => this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones', this.zoneId, 'sites']),
      error: (err) => { this.error = err.error?.message ?? '建立失敗'; this.submitting = false; },
    });
  }

  cancel() { this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones', this.zoneId, 'sites']); }
}
