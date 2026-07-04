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
  readonly host = environment.apiUrl.replace('/api', '');

  constructor(private campService: CampManagementService) {}

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
