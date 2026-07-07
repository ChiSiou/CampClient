import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarouselModule } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ExplorationService } from '../../services/exploration.service';
import { HomeFeedDto } from '../../interfaces/camp.interface';
import { CampCard } from '../shared/camp-card/camp-card';
import { SearchBar } from '../shared/search-bar/search-bar';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
  imports: [
    RouterLink,
    CarouselModule,
    ButtonModule,
    SkeletonModule,
    CampCard,
    SearchBar,
  ],
})
export class Home implements OnInit {
  feed: HomeFeedDto | null = null;
  loading = true;

  constructor(private explorationService: ExplorationService) {}

  // 每個推薦區塊各自捲動：把該列的 DOM 元素從模板直接傳進來，不用為每列開一個 ViewChild
  scrollRow(row: HTMLElement, direction: 1 | -1) {
    row.scrollBy({ left: direction * 400, behavior: 'smooth' });
  }

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
