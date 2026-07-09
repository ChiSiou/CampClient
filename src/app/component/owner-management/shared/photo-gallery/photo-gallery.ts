import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import { CampMediumDto } from '../../../../interfaces/camp-management.interface';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-photo-gallery',
  imports: [CommonModule],
  templateUrl: './photo-gallery.html',
  styleUrl: './photo-gallery.css',
})
export class PhotoGallery implements OnInit {
  @Input() referenceType!: 'campground' | 'zone' | 'site';
  @Input() referenceId!: number;

  photos: CampMediumDto[] = [];
  uploading = false;
  private readonly host = environment.apiUrl.replace('/api', '');

  constructor(private campService: CampManagementService) {}

  // 照片路徑可能是完整外部網址（R2 回傳的、或舊資料的 Unsplash 網址）或後端本機上傳的相對路徑
  // （/uploads/...，換到 R2 之前的舊資料），相對路徑才需要補上後端網域，完整網址原樣使用——
  // 不然把 host 無條件接在完整網址前面會變成語法錯誤的網址（例如 R2 網址會被接成
  // "https://localhost:7011https://pub-xxxx.r2.dev/..."，瀏覽器讀不到）。
  // 跟 camp-card.ts / camp-detail.ts / liked.ts / gantt-calendar.ts 用同一套判斷邏輯。
  resolveImageUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `${this.host}${url}`;
    return url;
  }

  ngOnInit() {
    this.loadPhotos();
  }

  loadPhotos() {
    const req =
      this.referenceType === 'campground' ? this.campService.listCampgroundPhotos(this.referenceId) :
      this.referenceType === 'zone'       ? this.campService.listZonePhotos(this.referenceId) :
                                            this.campService.listSitePhotos(this.referenceId);
    req.subscribe({ next: (photos) => this.photos = photos });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    const req =
      this.referenceType === 'campground' ? this.campService.uploadCampgroundPhoto(this.referenceId, file) :
      this.referenceType === 'zone'       ? this.campService.uploadZonePhoto(this.referenceId, file) :
                                            this.campService.uploadSitePhoto(this.referenceId, file);

    req.subscribe({
      next: (photo) => {
        this.photos.push(photo);
        this.uploading = false;
        input.value = ''; // 清空 file input，讓同一張圖可以重複上傳
      },
      error: () => { this.uploading = false; },
    });
  }

  deletePhoto(mediaId: number) {
    if (!confirm('確定刪除這張照片？')) return;
    this.campService.deletePhoto(mediaId).subscribe({
      next: () => { this.photos = this.photos.filter(p => p.id !== mediaId); },
    });
  }

  setCover(mediaId: number) {
    this.campService.setCoverPhoto(mediaId).subscribe({
      next: () => {
        this.photos = this.photos.map(p => ({ ...p, isCover: p.id === mediaId }));
      },
    });
  }
}
