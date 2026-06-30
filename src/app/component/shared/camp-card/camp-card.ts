import { Component, Input } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CampSearchResultDto } from '../../../interfaces/camp.interface';

@Component({
  selector: 'app-camp-card',
  templateUrl: './camp-card.html',
  styleUrl: './camp-card.css',
  imports: [RouterLink, NgClass, DecimalPipe, RatingModule, FormsModule, ButtonModule],
})
export class CampCard {
  @Input() camp!: CampSearchResultDto;
  @Input() layout: 'vertical' | 'horizontal' = 'vertical';

  currentImageIndex = 0;

  // p-rating 只用 `星數 <= value` 判斷填滿與否，不會四捨五入，
  // 所以像 3.8 分這種非整數平均分要先四捨五入成整數星數再丟進去顯示
  get displayRating(): number {
    return Math.round(this.camp.averageRating);
  }

  prevImage(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.currentImageIndex =
      (this.currentImageIndex - 1 + this.camp.imageUrls.length) % this.camp.imageUrls.length;
  }

  nextImage(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.currentImageIndex =
      (this.currentImageIndex + 1) % this.camp.imageUrls.length;
  }

  toggleLike(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.camp.isLiked = !this.camp.isLiked;
  }
}
