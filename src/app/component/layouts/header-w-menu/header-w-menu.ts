import { Menu } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { Component, HostBinding, HostListener, OnDestroy, viewChild } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { MenuItem, MessageService } from 'primeng/api';
import { MemberService } from '../../member/Service/member-service';
import { NotificationService } from '../../notification-center/Service/NotificationService';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-header-w-menu',
  imports: [RouterOutlet, RouterLink, ButtonModule, Menu],
  templateUrl: './header-w-menu.html',
  styleUrl: './header-w-menu.css',
})
export class HeaderWMenu implements OnDestroy {
  constructor(
    private routes: Router,
    private memberservice: MemberService,
    private messageService: MessageService,
    private notificationService: NotificationService,
  ) {}
  profile: any;
  unreadCount = 0;
  username = '';
  userrole = '';
  activeUserRole = '';
  private unreadCountSubscription?: Subscription;
  private profileSubscription?: Subscription;
  private unreadRefreshTimer?: ReturnType<typeof setInterval>;

  @HostBinding('class.owner-role')
  get isOwnerRole(): boolean {
    return this.activeUserRole === 'Owner';
  }

  ngOnInit() {
    this.unreadCountSubscription = this.notificationService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });

    this.profileSubscription = this.memberservice.currentProfile$.subscribe((profile) => {
      this.applyCurrentProfile(profile);
    });

    this.activeUserRole = this.memberservice.getActiveRole();
    this.userrole = this.memberservice.getrole();
    this.username = this.username || this.memberservice.getname();
    this.loadStoredProfile();

    this.loadUnreadCount();
    this.unreadRefreshTimer = setInterval(() => this.loadUnreadCount(), 15000);
    if (this.memberservice.isAuthenticated()) {
      this.loadProfile();
    }
    const token = localStorage.getItem('token');
    if (token != null) {
      const decoded: any = jwtDecode(token);
      console.log(decoded);
    }
  }

  private loadProfile() {
    this.memberservice.getProfile().subscribe({
      next: (res) => {
        this.profile = res.profileData ?? res.ProfileData;
        const ownerProfile = this.profile?.ownerProfile ?? this.profile?.OwnerProfile;
        const displayName =
          this.activeUserRole === 'Owner'
            ? (ownerProfile?.realname ??
              ownerProfile?.realName ??
              ownerProfile?.Realname ??
              this.profile?.name ??
              this.profile?.Name)
            : (this.profile?.name ?? this.profile?.Name);
        this.username = displayName ?? this.username;
        if (this.username) {
          this.profile = { ...(this.profile ?? {}), name: this.username, Name: this.username };
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  @HostListener('window:focus')
  refreshUnreadCountOnFocus() {
    this.loadUnreadCount();
  }

  @HostListener('window:currentProfileChanged', ['$event'])
  onCurrentProfileChanged(event: Event) {
    this.applyCurrentProfile((event as CustomEvent).detail);
  }

  private loadStoredProfile() {
    const rawProfile = localStorage.getItem('currentProfile');

    if (!rawProfile) {
      return;
    }

    try {
      this.applyCurrentProfile(JSON.parse(rawProfile));
    } catch {
      localStorage.removeItem('currentProfile');
    }
  }

  private applyCurrentProfile(profile: any) {
    if (!profile?.name) {
      return;
    }

    this.username = profile.name;
    this.profile = { ...(this.profile ?? {}), name: profile.name, Name: profile.name };
  }

  ngOnDestroy() {
    this.unreadCountSubscription?.unsubscribe();
    this.profileSubscription?.unsubscribe();

    if (this.unreadRefreshTimer) {
      clearInterval(this.unreadRefreshTimer);
    }
  }
  liked() {
    if (this.activeUserRole === 'User') {
      this.routes.navigate(['/member-center/liked']);
    }
  }
  order() {
    if (this.activeUserRole === 'User') {
      this.routes.navigate(['/member-center/orders']);
    } else if (this.activeUserRole === 'Owner') {
      this.routes.navigate(['/ownerCenter/orders']);
    }
  }
  itinerary() {
    if (this.activeUserRole === 'User') {
      this.routes.navigate(['/itinerary']);
    }
  }
  notifications() {
    if (this.activeUserRole === 'User') {
      this.routes.navigate(['/member-center/notifications']);
    } else if (this.activeUserRole === 'Owner') {
      this.routes.navigate(['/ownerCenter/notifications']);
    }
  }
  profiles() {
    if (this.activeUserRole === 'User') {
      this.routes.navigate(['/member-center']);
    } else if (this.activeUserRole === 'Owner') {
      this.routes.navigate(['/ownerCenter/profile']);
    }
  }
  settings() {
    if (this.activeUserRole === 'User') {
      this.routes.navigate(['/member-center/memberEdit']);
    } else if (this.activeUserRole === 'Owner') {
      this.routes.navigate(['/ownerCenter/profileEdit']);
    }
  }
  readonly menu = viewChild.required<Menu>('menu');
  readonly menuItems: MenuItem[] = [
    { label: '我的收藏', icon: 'pi pi-heart', command: () => this.liked() },
    { label: '訂單', icon: 'pi pi-receipt', command: () => this.order() },
    { label: '行程', icon: 'pi pi-map', command: () => this.itinerary() },
    { label: '訊息通知', icon: 'pi pi-bell', command: () => this.notifications() },
    { label: '個人簡介', icon: 'pi pi-id-card', command: () => this.profiles() },
    { label: '帳號設定', icon: 'pi pi-cog', command: () => this.settings() },
    { label: '登出', icon: 'pi pi-sign-out', command: () => this.memberservice.logout() },
  ];

  toggleMenu(event: Event) {
    this.menu().toggle(event);
  }

  loadUnreadCount(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      this.notificationService.clearUnreadCount();
      return;
    }

    this.notificationService.refreshUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: () => {
        this.notificationService.clearUnreadCount();
      },
    });
  }
  goNotification() {
    if (this.activeUserRole === 'Owner') {
      this.routes.navigate(['/ownerCenter/notifications']);
    } else if (this.activeUserRole === 'User') {
      this.routes.navigate(['/member-center/notifications']);
    }
  }
  Center() {
    if (this.activeUserRole === 'Owner') {
      this.routes.navigate(['/ownerCenter']);
    } else if (this.activeUserRole === 'User') {
      this.routes.navigate(['/member-center']);
    } else {
      this.routes.navigate(['/login']);
    }
  }
  switchRole(roleName: string) {
    this.memberservice.switchRole(roleName).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('roles', JSON.stringify(res.roles));
        localStorage.setItem('activeRole', res.activeRole);

        // 重點：同步更新畫面變數
        this.activeUserRole = res.activeRole;
        this.userrole = res.roles;
        this.notificationService.refreshUnreadCount().subscribe();
        this.loadProfile();

        if (res.activeRole === 'Owner') {
          this.routes.navigate(['/ownerCenter']);
        } else if (res.activeRole === 'User') {
          this.routes.navigate(['/member-center']);
        } else {
          this.routes.navigate(['/']);
        }
      },
      error: (err) => {
        console.log(err);
        this.messageService.add({
          key: 'top-right',
          severity: 'error',
          summary: `登入失敗`,
          detail: '請先註冊成為營主',
        });
        this.routes.navigate(['owner-register']);
      },
    });
  }
}
