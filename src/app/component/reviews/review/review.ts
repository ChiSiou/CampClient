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

  lightboxVisible: boolean = false;
  lightboxImages: { picId?: number; imageUrl: string }[] = [];
  lightboxIndex: number = 0;

  ngOnInit(): void {
    this.sReview.getRiviewAPI().subscribe((data) => {
      this.reviews = data;
      console.log(data);

      // 抓取其他資料
      this.totalReviews = data.length;

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

}
