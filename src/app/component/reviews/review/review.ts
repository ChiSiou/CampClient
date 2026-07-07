import { Member } from '../../layouts/member/member';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SReview } from '../service/sreview';
import { IReview } from '../interfaces/IReview';
import { RatingModule, Rating } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { PanelModule } from 'primeng/panel';
import { CardModule } from 'primeng/card';
import { GalleriaModule } from 'primeng/galleria';
import { Dialog } from "primeng/dialog";
import { Toast } from "primeng/toast";
import { Message } from "primeng/message";
import { FloatLabel } from "primeng/floatlabel";
import { FileSelectEvent, FileUpload } from "primeng/fileupload";
import { MessageService } from 'primeng/api';
import { PrimeNG } from 'primeng/config';
import { MemberService } from '../../member/Service/member-service';
import { date } from '@primeuix/themes/aura/datepicker';


@Component({
  selector: 'app-review',
  imports: [Rating, FormsModule, PaginatorModule, AvatarModule, ButtonModule, MenuModule, PanelModule, CardModule, GalleriaModule, Dialog, Toast, Message, FloatLabel, FileUpload, DatePipe],
  templateUrl: './review.html',
  styleUrl: './review.css',
  providers: [MessageService],
})
export class Review {

  constructor(private sReview: SReview, private primeng: PrimeNG, private memberService: MemberService) {
    this.primeng.setTranslation({ pending: '等待上傳' });
  }

  reviews: IReview[] = [];
  first: number = 0;
  rows: number = 10;
  totalReviews: number = 120;
  activeIndex: number = 0;
  campAVGScore: number = 0;
  ratingCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  lightboxVisible: boolean = false;
  lightboxImages: { picId?: number; imageUrl: string }[] = [];
  lightboxIndex: number = 0;

  // 編輯視窗
  editVisible = false;

  editParam = {
    reviewId: 0,
    userId: 0,
    campId: 0,
    rating: 0,
    commentText: "",
    isHaveImgs: false,
    status: 0,
    createdAt: null,
    updatedAt: null,
    reviewAtId: 0,
    orderId: 0,
    userRole: 0,
    reviewImages: [] as { imageUrl: string }[],
    userName: "",
  };

  // 接收父元件傳入
  @Input() f_campId = 0;

  // 使用者傳圖
  private messageService = inject(MessageService);
  selectedFiles: File[] = [];
  uploadedImageUrls: string[] = [];
  reviewForm = {
    submitted: false,
    valid: false,
  };

  ngOnInit(): void {
    this.editParam.userId = Number(this.sReview.getUserId());
    this.editParam.campId = this.f_campId;
    this.getData();
  }

  getData() {
    this.sReview.getRiviewAPI(this.f_campId).subscribe((data) => {

      this.reviews = data.filter(c => c.campId === this.f_campId);
      // 抓取其他資料
      this.totalReviews = data.length;
      // --- 計算平均分開始 ---
      if (this.totalReviews > 0) {
        // 1. 先用 reduce 把所有的 rating 加總
        const totalScore = data.reduce((sum, item) => sum + (item.rating || 0), 0);
        // 2. 除以總筆數，並用 +...toFixed(1) 四捨五入到小數點後第一位（可依需求調整）
        this.campAVGScore = +(totalScore / data.length).toFixed(1);
      } else {
        this.campAVGScore = 0;
      }
      this.ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      data.forEach(item => {
        const r = item.rating;
        if (r >= 1 && r <= 5) this.ratingCounts[r]++;
      });
      // --- 計算平均分結束 ---

    });
  }

  onPageChange(event: PaginatorState) {
    this.first = event.first ?? 0;
    this.rows = event.rows ?? 10;
  }

  openLightbox(images: { picId?: number; imageUrl: string }[], index: number) {
    this.lightboxImages = images;
    this.lightboxIndex = index;
    this.lightboxVisible = true;
  }

  deleteReview(id: number) {
    if (confirm('確定要刪除這則評論嗎？')) { // User confirmation
      this.sReview.deleteReviewAPI(id).subscribe({
        next: () => {
          this.reviews = this.reviews.filter(item => item.reviewId !== id);
          console.log('評論成功刪除');
          this.getData();
        },
        error: (err) => {
          console.error('評論刪除失敗', err);
        }
      });
    }
  }

  showEditDialog(id: number) {
    this.sReview.getRiviewByIdAPI(id).subscribe((data: any) => {
      this.editParam = { ...data, reviewImages: data.reviewImages ?? [] };
      this.selectedFiles = [];
      this.uploadedImageUrls = [];
      this.editVisible = true;
    });
  }

  onSelect(event: any) {
    this.selectedFiles = event.currentFiles;
  }

  onSubmit(form: any) {
    if (this.editParam.rating > 0) {
      form.valid = true;
    } else {
      form.valid = false;
    }

    if (!form.valid) {
      this.messageService.add({ severity: 'error', summary: '評論失敗', detail: '請檢查必填欄位。', life: 3000 });
      return;
    }

    if (this.selectedFiles.length > 0) {
      this.uploadAllFiles().then(() => {
        this.putReview();
      });
    } else {
      this.putReview();
    }
  }

  removeExistingImage(index: number) {
    this.editParam.reviewImages = this.editParam.reviewImages.filter((_, i) => i !== index);
    this.editParam.isHaveImgs = this.editParam.reviewImages.length > 0;
  }

  async uploadAllFiles(): Promise<void> {
    for (const file of this.selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await this.sReview.uploadImage(formData).toPromise();
      this.editParam.reviewImages = [...(this.editParam.reviewImages ?? []), { imageUrl: res.imageUrl }];
    }
    this.editParam.isHaveImgs = this.editParam.reviewImages.length > 0;
    this.uploadedImageUrls = this.editParam.reviewImages.map(x => x.imageUrl);
  }

  putReview() {
    const param = this.editParam;

    this.sReview.putReviewAPI(param.reviewId, param).subscribe({
      next: () => {
        this.getData();
        this.messageService.add({ severity: 'success', summary: '評論成功', detail: '更新完成。', life: 3000 });
        this.editVisible = false;
        this.selectedFiles = [];
      },
      error: (err) => {
        console.error('評論更新失敗', err);
        this.messageService.add({ severity: 'error', summary: '更新失敗', detail: '請稍後再試。', life: 3000 });
      }
    });
  }

}
