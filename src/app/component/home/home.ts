import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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

  @ViewChild('campsRow') campsRow!: ElementRef<HTMLDivElement>;

  constructor(private explorationService: ExplorationService) {}

  scrollCamps(direction: 1 | -1) {
    this.campsRow.nativeElement.scrollBy({ left: direction * 400, behavior: 'smooth' });
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
