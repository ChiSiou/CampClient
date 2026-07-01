import { Component, Input } from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { HttpClient } from '@angular/common/http';
import { CampSearchResultDto } from '../../../interfaces/camp.interface';
import { MemberService } from '../../member/Service/member-service';

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
  likeLoading = false;

  private readonly campLikeUrl = 'https://localhost:7011/api/CampLike';

  constructor(
    private http: HttpClient,
    private memberService: MemberService,
    private router: Router,
  ) {}

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

    if (!this.memberService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.likeLoading) return;
    this.likeLoading = true;

    const wasLiked = this.camp.isLiked;
    this.camp.isLiked = !wasLiked; // 樂觀更新，先切換 UI

    const request$ = wasLiked
      ? this.http.delete(`${this.campLikeUrl}/${this.camp.id}`)
      : this.http.post(`${this.campLikeUrl}/${this.camp.id}`, {});

    request$.subscribe({
      next: () => {
        this.likeLoading = false;
      },
      error: () => {
        this.camp.isLiked = wasLiked; // 失敗時還原
        this.likeLoading = false;
      },
    });
  }
}
