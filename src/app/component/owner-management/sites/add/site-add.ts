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

  // 一般營區（zoneType=1）走批次建立：沒有具名最小單位，營主只填「要幾個位置」，
  // 編號由系統自動接續產生（甘特圖列名會顯示編號，所以要編得乾淨）；照片一律用 Zone 的，
  // 個別營位不上傳。特別營區（zoneType=2）維持逐筆建立＋逐筆照片。
  quantity = 1;
  // 自動編號起點：現有營位編號中最大的數字 +1（處理過「刪掉中間幾個」的情況，避免撞號）
  private nextNumber = 1;

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

    // 算自動編號起點：只看「純數字」的既有編號取最大值，手動取名的（例如 A-01）不影響流水號
    this.campService.listSites(this.zoneId).subscribe({
      next: (sites) => {
        const numbers = sites
          .map(s => parseInt(s.siteNumber, 10))
          .filter(n => !isNaN(n));
        this.nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
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
    if (this.zoneType !== 1 && !this.form.siteNumber.trim()) { this.error = '請填寫營位編號'; return; }
    if (this.zoneType === 1 && (!this.quantity || this.quantity < 1)) { this.error = '數量至少為 1'; return; }
    if (this.accomTypes.length > 0 && this.form.accomTypeIds.length === 0) {
      this.error = '請選擇住宿類型'; return;
    }
    this.submitting = true;
    this.error = '';
    try {
      if (this.zoneType === 1) {
        // 一般營區：批次建立，編號自動接續（補零到兩位，甘特圖列名排序才不會 1,10,2）
        // 失敗時 nextNumber 已隨成功筆數前進，使用者按重試只會補建剩下的，不會撞號或重複建
        const total = Math.floor(this.quantity);
        for (let i = 0; i < total; i++) {
          const dto: CampsiteCreateDto = {
            ...this.form,
            siteNumber: String(this.nextNumber).padStart(2, '0'),
            capacityPeople: +this.form.capacityPeople || 1,
          };
          await this.campService.createSite(this.zoneId, dto).toPromise();
          this.nextNumber++;
          this.quantity = total - (i + 1);
        }
      } else {
        const dto: CampsiteCreateDto = { ...this.form, capacityPeople: +this.form.capacityPeople || 1 };
        const res = await this.campService.createSite(this.zoneId, dto).toPromise();
        const id = res!.id;
        for (const file of this.selectedFiles) {
          await this.campService.uploadSitePhoto(id, file).toPromise();
        }
      }
      this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones', this.zoneId, 'sites']);
    } catch (err: any) {
      this.error = err.error?.message ?? '建立失敗';
      this.submitting = false;
    }
  }

  cancel() { this.router.navigate(['/ownerCenter/camps', this.campgroundId, 'zones', this.zoneId, 'sites']); }
}
