import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import { AccomTypeDto, CampsiteUpdateDto } from '../../../../interfaces/camp-management.interface';
import { PhotoGallery } from '../../shared/photo-gallery/photo-gallery';

@Component({
  selector: 'app-site-edit',
  imports: [CommonModule, FormsModule, RouterLink, PhotoGallery],
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
  zoneType = 0;
  loading = true;
  submitting = false;
  error = '';

  accomTypes: AccomTypeDto[] = [];

  form: CampsiteUpdateDto = { siteNumber: '', capacityPeople: 4, siteStatus: 1, description: '', facilityIds: [], accomTypeIds: [] };

  constructor(private route: ActivatedRoute, private router: Router, private campService: CampManagementService) {}

  ngOnInit() {
    this.campgroundId = +this.route.snapshot.paramMap.get('campId')!;
    this.zoneId = +this.route.snapshot.paramMap.get('zoneId')!;
    this.siteId = +this.route.snapshot.paramMap.get('siteId')!;

    this.campService.getCampground(this.campgroundId).subscribe({
      next: (data) => {
        this.campgroundName = data.name;
        const zone = (data.zones ?? []).find(z => z.id === this.zoneId);
        this.zoneName = zone?.zoneName ?? '';
        this.zoneType = zone?.zoneType ?? 0;

        this.campService.getAccomTypes(this.zoneType).subscribe({
          next: (types) => { this.accomTypes = types; this.tryResolveAccomIds(); },
        });
      },
    });

    this.campService.listSites(this.zoneId).subscribe({
      next: (sites) => {
        const site = sites.find(s => s.id === this.siteId);
        if (!site) { this.error = '找不到此營位'; this.loading = false; return; }
        this.siteNumber = site.siteNumber;
        // 從 accomTypeNames 反推 id 需要等 accomTypes 載入，改存 accomTypeIds 的方式：
        // 後端 CampsiteListItemDto 只回傳 accomTypeNames（string[]），不回傳 ids
        // 因此先用空陣列，待 accomTypes 載入後再由 typeName 反查
        this.form = {
          siteNumber: site.siteNumber,
          capacityPeople: site.capacityPeople,
          siteStatus: site.siteStatus,
          description: site.description,
          facilityIds: [],
          accomTypeIds: [],
        };
        this._pendingAccomTypeNames = site.accomTypeNames ?? [];
        this.loading = false;
        this.tryResolveAccomIds();
      },
      error: () => { this.error = '載入失敗'; this.loading = false; },
    });
  }

  private _pendingAccomTypeNames: string[] = [];

  private tryResolveAccomIds() {
    if (this._pendingAccomTypeNames.length === 0 || this.accomTypes.length === 0) return;
    this.form.accomTypeIds = this.accomTypes
      .filter(a => this._pendingAccomTypeNames.includes(a.typeName))
      .map(a => a.id);
  }

  toggleAccomType(id: number) {
    const idx = this.form.accomTypeIds.indexOf(id);
    if (idx >= 0) this.form.accomTypeIds.splice(idx, 1);
    else this.form.accomTypeIds.push(id);
  }

  isAccomTypeChecked(id: number) {
    return this.form.accomTypeIds.includes(id);
  }

  submit() {
    if (!this.form.siteNumber.trim()) { this.error = '請填寫營位編號'; return; }
    if (this.accomTypes.length > 0 && this.form.accomTypeIds.length === 0) {
      this.error = '請選擇住宿類型'; return;
    }
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
