import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../services/camp-management.service';
import { CampgroundListItemDto, CampgroundStatus } from '../../../interfaces/camp-management.interface';

@Component({
  selector: 'app-camps',
  imports: [CommonModule, RouterLink],
  templateUrl: './camps.html',
  styleUrl: './camps.css',
})
export class Camps implements OnInit {
  campgrounds: CampgroundListItemDto[] = [];
  CampgroundStatus = CampgroundStatus;
  apiHost = 'https://localhost:7011';

  constructor(private campService: CampManagementService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.campService.listMine().subscribe({
      next: (data) => (this.campgrounds = data),
      error: (err) => console.error('載入失敗', err),
    });
  }

  delete(id: number, name: string) {
    if (!confirm(`確定要刪除「${name}」嗎？`)) return;
    this.campService.deleteCampground(id).subscribe({
      next: () => this.load(),
      error: (err) => alert(err.error?.message ?? '刪除失敗'),
    });
  }
}
