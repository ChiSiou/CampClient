import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CampSearchResultDto } from '../../../interfaces/camp.interface';

@Component({
  selector: 'app-camp-card',
  templateUrl: './camp-card.html',
  styleUrl: './camp-card.css',
  imports: [CommonModule, RouterLink, RatingModule, FormsModule, ButtonModule],
})
export class CampCard {
  @Input() camp!: CampSearchResultDto;

  currentImageIndex = 0;

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
