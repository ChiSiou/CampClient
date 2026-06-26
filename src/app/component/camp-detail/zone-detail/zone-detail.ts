import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CalendarService } from '../../../services/calendar.service';
import { CampZoneCalendarDto } from '../../../interfaces/camp.interface';

// 骨架階段：先確保 /camp/:id/zone/:zoneId 能正常導航、撈到資料
// Generic 月曆+數量選擇 / UniqueUnit 卡片多選，下一步再實作
@Component({
  selector: 'app-zone-detail',
  imports: [],
  templateUrl: './zone-detail.html',
  styleUrl: './zone-detail.css',
})
export class ZoneDetail implements OnInit {
  campgroundId = 0;
  zoneId = 0;
  calendar: CampZoneCalendarDto | null = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private calendarService: CalendarService,
  ) {}

  ngOnInit() {
    this.campgroundId = Number(this.route.snapshot.paramMap.get('id'));
    this.zoneId = Number(this.route.snapshot.paramMap.get('zoneId'));

    this.calendarService.getZoneCalendar(this.zoneId).subscribe({
      next: res => {
        this.calendar = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  back() {
    this.router.navigate(['/camp', this.campgroundId]);
  }
}
