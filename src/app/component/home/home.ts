import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ExplorationService } from '../../services/exploration.service';
import { HomeFeedDto } from '../../interfaces/camp.interface';
import { CampCard } from '../shared/camp-card/camp-card';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
  imports: [
    CommonModule,
    RouterLink,
    CarouselModule,
    ButtonModule,
    SkeletonModule,
    CampCard,
  ],
})
export class Home implements OnInit {
  feed: HomeFeedDto | null = null;
  loading = true;

  constructor(private explorationService: ExplorationService) {}

  ngOnInit() {
    this.explorationService.getHome().subscribe({
      next: (data) => {
        this.feed = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
