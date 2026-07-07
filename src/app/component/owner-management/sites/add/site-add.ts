import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import { AccomTypeDto, CampsiteCreateDto } from '../../../../interfaces/camp-management.interface';

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
  zoneType = 0;
  submitting = false;
  error = '';
  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  accomTypes: AccomTypeDto[] = [];
  selectedAccomTypeId: number | null = null; // 園區住宿（單選）

  form: CampsiteCreateDto = { siteNumber: '', capacityPeople: 4, description: '', facilityIds: [], accomTypeIds: [] };

  constructor(private route: ActivatedRoute, private router: Router, private campService: CampManagementService) {}

  ngOnInit() {
    this.campgroundId = +this.route.snapshot.paramMap.get('campId')!;
    this.zoneId = +this.route.snapshot.paramMap.get('zoneId')!;

    this.campService.getCampground(this.campgroundId).subscribe({
      next: (data) => {
        this.campgroundName = data.name;
        const zone = (data.zones ?? []).find(z => z.id === this.zoneId);
        this.zoneName = zone?.zoneName ?? '';
        this.zoneType = zone?.zoneType ?? 0;

        // 載入對應 category 的住宿類型（ZoneType 值就等於 AccomType.Category）
        this.campService.getAccomTypes(this.zoneType).subscribe({
          next: (types) => this.accomTypes = types,
        });
      },
    });
  }

  toggleAccomType(id: number) {
    const idx = this.form.accomTypeIds.indexOf(id);
    if (idx >= 0) this.form.accomTypeIds.splice(idx, 1);
    else this.form.accomTypeIds.push(id);
  }

  isAccomTypeChecked(id: number) {
    return this.form.accomTypeIds.includes(id);
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    this.selectedFiles.push(...files);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = (e) => this.previewUrls.push(e.target!.result as string);
      reader.readAsDataURL(f);
    });
  }

  removeFile(i: number) {
    this.selectedFiles.splice(i, 1);
    this.previewUrls.splice(i, 1);
  }

  async submit() {
    if (!this.form.siteNumber.trim()) { this.error = '請填寫營位編號'; return; }
    if (this.accomTypes.length > 0 && this.form.accomTypeIds.length === 0) {
      this.error = '請選擇住宿類型'; return;
    }
    this.submitting = true;
    this.error = '';
    const dto: CampsiteCreateDto = { ...this.form, capacityPeople: +this.form.capacityPeople || 1 };
    try {
      const res = await this.campService.createSite(this.zoneId, dto).toPromise();
      const id = res!.id;
      for (const file of this.selectedFiles) {
        await this.campService.uploadSitePhoto(id, file).toPromise();
      }
      this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones', this.zoneId, 'sites']);
    } catch (err: any) {
      this.error = err.error?.message ?? '建立失敗';
      this.submitting = false;
    }
  }

  cancel() { this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones', this.zoneId, 'sites']); }
}
