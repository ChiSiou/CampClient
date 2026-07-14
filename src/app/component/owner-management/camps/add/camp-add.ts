import { Component, AfterViewInit, OnDestroy, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import { CampgroundCreateDto, TagDto } from '../../../../interfaces/camp-management.interface';
import * as L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

@Component({
  selector: 'app-camp-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './camp-add.html',
  styleUrl: './camp-add.css',
})
export class CampAdd implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map?: L.Map;
  private marker?: L.Marker;

  form: CampgroundCreateDto = {
    name: '',
    phone: '',
    elevation: 0,
    description: '',
    website: '',
    basePrice: 0,
    area: '',
    latitude: 0,
    longitude: 0,
    rules: '',
    highlights: [],
    facilityIds: [],
    tagIds: [],
  };
  highlightInput = '';
  submitting = false;
  locating = false;
  fetchingElevation = false;
  error = '';
  currentStep = 1;
  stepLabels = ['基本資料', '地區與地圖', '標籤', '照片'];
  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  tags: TagDto[] = [];
  tagsByCategory: { category: string; items: TagDto[] }[] = [];

  constructor(private campService: CampManagementService, private router: Router) {}

  ngOnInit() {
    this.campService.getTags().subscribe({
      next: (tags) => {
        this.tags = tags;
        const grouped = new Map<string, TagDto[]>();
        tags.forEach(t => {
          if (!grouped.has(t.category)) grouped.set(t.category, []);
          grouped.get(t.category)!.push(t);
        });
        this.tagsByCategory = Array.from(grouped.entries()).map(([category, items]) => ({ category, items }));
      }
    });
  }

  toggleTag(id: number) {
    const idx = this.form.tagIds.indexOf(id);
    if (idx >= 0) this.form.tagIds.splice(idx, 1);
    else this.form.tagIds.push(id);
  }
  isTagSelected(id: number) { return this.form.tagIds.includes(id); }

  addHighlight() {
    const text = this.highlightInput.trim();
    if (!text || this.form.highlights.length >= 3) return;
    this.form.highlights.push(text);
    this.highlightInput = '';
  }

  removeHighlight(i: number) {
    this.form.highlights.splice(i, 1);
  }

  private mapInitialized = false;

  ngAfterViewInit() {}

  // 地圖延後到使用者第一次切到「地區與地圖」那步才初始化：
  // 第 1 步時這個容器是 display:none，這時候建立 Leaflet 地圖會抓到 0 尺寸，
  // 之後就算切到可見的步驟，畫面也是空白的（invalidateSize 救不回一開始就抓錯的尺寸）。
  private initMap() {
    this.map = L.map(this.mapContainer.nativeElement).setView([23.5, 121.0], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private setLocation(lat: number, lng: number) {
    this.form.latitude = Math.round(lat * 1000000) / 1000000;
    this.form.longitude = Math.round(lng * 1000000) / 1000000;
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng]).addTo(this.map!);
    }
  }

  // 定位搜尋關鍵字跟「地址」欄位分開：地址會存進資料庫、前台會顯示，必須是真實地址；
  // 但拿地址丟 Google 定位常常不準，用「營區名稱」搜尋反而更精準。
  // 定位框選填：有填就用它定位，留空自動退回用地址欄位，正常情況營主不用多打字。
  locateQuery = '';

  locateByAddress() {
    const query = this.locateQuery.trim() || this.form.area.trim();
    if (!query) return;
    this.locating = true;
    this.error = '';
    this.campService.geocode(query).subscribe({
      next: (res) => {
        this.map?.setView([res.lat, res.lng], 15);
        this.setLocation(res.lat, res.lng);
        this.locating = false;
      },
      error: () => {
        this.error = '找不到此地址，請調整關鍵字或直接點地圖選點';
        this.locating = false;
      },
    });
  }

  fetchElevation() {
    if (!this.form.latitude || !this.form.longitude) {
      this.error = '請先選擇地址或在地圖上點選位置';
      return;
    }
    this.fetchingElevation = true;
    this.error = '';
    this.campService.elevation(this.form.latitude, this.form.longitude).subscribe({
      next: (res) => {
        this.form.elevation = Math.round(res.elevation);
        this.fetchingElevation = false;
      },
      error: () => {
        this.error = '找不到此座標的高度資料，請手動輸入';
        this.fetchingElevation = false;
      },
    });
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

  nextStep() {
    this.error = '';
    if (this.currentStep === 1 && (!this.form.name.trim() || !this.form.phone.trim())) {
      this.error = '請填寫必填欄位（名稱、聯絡電話）';
      return;
    }
    if (this.currentStep === 2 && !this.form.area.trim()) {
      this.error = '請填寫地區/地址';
      return;
    }
    this.currentStep++;
    if (this.currentStep === 2) {
      if (!this.mapInitialized) {
        this.mapInitialized = true;
        setTimeout(() => this.initMap(), 0);
      } else {
        setTimeout(() => this.map?.invalidateSize(), 0);
      }
    }
  }

  prevStep() {
    this.error = '';
    this.currentStep--;
  }

  // 記住「已經成功建立」的營地 id：如果建立成功但照片上傳失敗，使用者按重試時
  // 不能再呼叫一次 createCampground，不然每重試一次就多一筆孤兒營地（Name/Area 都一樣、
  // 只是照片沒傳成功），要沿用同一筆繼續補傳照片
  private createdCampgroundId: number | null = null;

  async submit() {
    if (!this.form.name.trim() || !this.form.area.trim()) {
      this.error = '請填寫必填欄位（名稱、地區）';
      return;
    }
    this.submitting = true;
    this.error = '';

    try {
      let id = this.createdCampgroundId;
      if (id === null) {
        const dto: CampgroundCreateDto = {
          ...this.form,
          latitude: +this.form.latitude || 0,
          longitude: +this.form.longitude || 0,
          elevation: +this.form.elevation || 0,
          basePrice: +this.form.basePrice || 0,
        };
        const res = await this.campService.createCampground(dto).toPromise();
        id = res!.id;
        this.createdCampgroundId = id;
      }

      // 每上傳成功一張就從待傳清單移除，重試時只會補傳「還沒成功」的那幾張，
      // 不會把已經傳過的檔案再送一次
      for (const file of [...this.selectedFiles]) {
        await this.campService.uploadCampgroundPhoto(id, file).toPromise();
        const idx = this.selectedFiles.indexOf(file);
        if (idx >= 0) {
          this.selectedFiles.splice(idx, 1);
          this.previewUrls.splice(idx, 1);
        }
      }
      this.router.navigate(['/ownerCenter/camps']);
    } catch (err: any) {
      this.error = this.createdCampgroundId
        ? (err.error?.message ?? '照片上傳失敗，營地已建立，請重新選擇照片或直接按「建立營地」繼續上傳')
        : (err.error?.message ?? '建立失敗，請稍後再試');
      this.submitting = false;
    }
  }

  cancel() {
    this.router.navigate(['/ownerCenter/camps']);
  }
}
