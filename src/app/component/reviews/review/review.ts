import { Component, OnInit, signal } from '@angular/core';
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

@Component({
  selector: 'app-review',
  imports: [Rating, FormsModule, PaginatorModule, AvatarModule, ButtonModule, MenuModule, PanelModule, CardModule, GalleriaModule],
  templateUrl: './review.html',
  styleUrl: './review.css',
})
export class Review {

  constructor(private sReview: SReview) { }

  reviews: IReview[] = [];
  first: number = 0;
  rows: number = 10;
  totalReviews: number = 120;
  activeIndex: number = 0;
  campAVGScore: number = 0;

  lightboxVisible: boolean = false;
  lightboxImages: { picId?: number; imageUrl: string }[] = [];
  lightboxIndex: number = 0;

  ngOnInit(): void {
    this.sReview.getRiviewAPI().subscribe((data) => {
      this.reviews = data;
      console.log(data);
      // 抓取其他資料
      this.totalReviews = data.length;
      // --- 計算平均分開始 ---
      if (this.totalReviews > 0) {
        // 1. 先用 reduce 把所有的 rating 加總
        const totalScore = data.reduce((sum, item) => sum + (item.rating || 0), 0);
        // 2. 除以總筆數，並用 +...toFixed(1) 四捨五入到小數點後第一位（可依需求調整）
        this.campAVGScore = +(totalScore / data.length).toFixed(1);
      } else {
        this.campAVGScore = 0; // 如果沒資料就給 0，避免除以 0 變成 NaN
      }
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
        },
        error: (err) => {
          console.error('評論刪除失敗', err);
        }
      });
    }
  }

  putReview() {

    // let param = {
    //   reviewId: this.new_reviewId,
    //   userId: this.new_userId,
    //   campId: this.new_campId,
    //   rating: this.new_rating,
    //   commentText: this.new_commentText,
    //   isHaveImgs: this.new_isHaveImgs,
    //   status: this.new_status,
    //   createdAt: this.new_createdAt,
    //   updatedAt: this.new_updatedAt,
    //   reviewAtId: this.new_reviewAtId,
    //   orderId: this.new_orderId,
    //   userRole: this.new_userRole,
    //   reviewImages: this.uploadedImageUrls.map(url => ({ imageUrl: url })),
    // }

    // this.sReview.putRiviewAPI(param.reviewId,param).subscribe((data) => {
    //   this.reviews.push(param);
    //   data = this.reviews;
    //   console.log(data);
    // });

  }

}
