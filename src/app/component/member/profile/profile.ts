import { MemberService } from './../Service/member-service';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../notification-center/Service/NotificationService';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { SPostInteract } from '../../forum/service/sPostInteract';

interface LikedCampDto {
  campId: number;
}

@Component({
  selector: 'profile',
  imports: [RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  profile = {
    name: '',
    email: '',
    phone: '',
  };
  unreadCount = 0;
  ordercount = 0;
  likedcount = 0;
  private profileSubscription?: Subscription;
  constructor(
    private memberService: MemberService,
    private notification: NotificationService,
    private http: HttpClient,
    private sPostInteract: SPostInteract,
  ) {}

  ngOnInit(): void {
    this.profileSubscription = this.memberService.currentProfile$.subscribe((profile) => {
      if (profile) {
        this.profile = {
          name: profile.name ?? this.profile.name,
          email: profile.email ?? this.profile.email,
          phone: profile.phone ?? this.profile.phone,
        };
      }
    });

    this.notification.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount = Number(count) || 0;
      },
      error: () => {
        this.unreadCount = 0;
      },
    });
    this.memberService.getProfile().subscribe({
      next: (res) => {
        const profile = res.profileData ?? res.ProfileData;
        this.profile = {
          name: profile?.name ?? profile?.Name ?? this.memberService.getname() ?? '',

          email: profile?.email ?? profile?.Email ?? this.memberService.getemail() ?? '',
          phone: profile?.phone ?? profile?.Phone ?? this.memberService.getphone() ?? '',
        };
      },
      error: () => {
        this.profile = {
          name: this.memberService.getname() ?? '',
          email: this.memberService.getemail() ?? '',
          phone: this.memberService.getphone() ?? '',
        };
      },
    });
    this.memberService.getorder().subscribe({
      next: (res) => {
        this.ordercount = Array.isArray(res) ? res.length : 0;
      },
      error: () => {
        this.ordercount = 0;
      },
    });
    this.loadLikedCount();
  }
  ngOnDestroy(): void {
    this.profileSubscription?.unsubscribe();
  }

  MemberEdit() {
    this.memberService.memberEdit;
  }

  private loadLikedCount() {
    const userId = Number(this.memberService.getid());

    if (!userId) {
      this.likedcount = 0;
      return;
    }

    const campLikes$ = this.http.get<LikedCampDto[]>('https://localhost:7011/api/CampLike').pipe(
      map((items) => (Array.isArray(items) ? items.length : 0)),
      catchError(() => of(0)),
    );

    const postLikes$ = this.sPostInteract.getPostInteracts(undefined, userId, 1, 1000).pipe(
      map((items) =>
        Array.isArray(items) ? items.filter((item) => item.likePostId != null).length : 0,
      ),
      catchError(() => of(0)),
    );

    forkJoin([campLikes$, postLikes$]).subscribe(([campCount, postCount]) => {
      this.likedcount = campCount + postCount;
    });
  }
}
