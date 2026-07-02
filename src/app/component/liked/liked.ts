import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SPostInteract } from '../forum/service/sPostInteract';
import { Sforum } from '../forum/service/sforum';
import { IForum } from '../forum/interfaces/Iforum';
import { IPostInteract } from '../forum/interfaces/IPostInteract';
import { MemberService } from '../member/Service/member-service';

export interface LikedItem {
  id: string;
  type: 'camp' | 'post';
  refId: number;
  title: string;
  imageUrl: string | null;
  likedAt: string;
  // 營地專用
  area?: string;
  elevation?: number;
  basePrice?: number;
  tags?: string[];
  // 貼文專用
  category?: string;
  authorName?: string;
  excerpt?: string;
  likeCount?: number;
  commentCount?: number;
  postDate?: string;
  // 取消收藏用
  interactId?: number;
}

interface LikedCampDto {
  campId: number;
  campName: string;
  imageUrl: string | null;
  area: string;
  elevation: number;
  basePrice: number;
  tags: string[];
  likedAt: string;
}

@Component({
  selector: 'app-liked',
  imports: [CommonModule, DatePipe, DecimalPipe, RouterLink, FormsModule],
  templateUrl: './liked.html',
  styleUrl: './liked.css',
})
export class Liked implements OnInit {
  private campApiUrl = 'https://localhost:7011/api/CampLike';
  private postInteractApiUrl = 'https://localhost:7011/api/APIPostInteract';

  allItems: LikedItem[] = [];
  activeTab: 'all' | 'camp' | 'post' = 'all';
  displayCount = 5;
  currentPage = 1;

  constructor(
    private http: HttpClient,
    private memberService: MemberService,
    private sPostInteract: SPostInteract,
    private sforum: Sforum,
    private router: Router,
  ) {}

  ngOnInit() {
    this.loadLikedItems();
  }

  private loadLikedItems() {
    const userId = this.memberService.getid();

    const camps$ = this.http.get<LikedCampDto[]>(`${this.campApiUrl}`).pipe(
      map((camps) =>
        camps.map<LikedItem>((c) => ({
          id: `camp-${c.campId}`,
          type: 'camp',
          refId: c.campId,
          title: c.campName,
          imageUrl: c.imageUrl,
          likedAt: c.likedAt,
          area: c.area,
          elevation: c.elevation,
          basePrice: c.basePrice,
          tags: c.tags,
        })),
      ),
      catchError(() => of([] as LikedItem[])),
    );

    const posts$ = this.sPostInteract.getPostInteracts(undefined, userId).pipe(
      switchMap((interacts) => {
        const liked = interacts.filter((i) => i.likePostId != null);
        if (liked.length === 0) return of([] as LikedItem[]);

        const postCalls = liked.map((i) =>
          this.sforum.getPostById(i.likePostId!).pipe(
            map<IForum, LikedItem>((post) => ({
              id: `post-${post.postId}`,
              type: 'post',
              refId: post.postId,
              title: post.title,
              imageUrl: post.moreImages?.[0]?.imageUrl ?? null,
              likedAt: post.postDate ?? '',
              category: post.postCategoryName ?? '',
              authorName: post.userName ?? '',
              excerpt: post.mainContent,
              likeCount: post.likeCount ?? 0,
              commentCount: post.commentCount ?? 0,
              postDate: post.postDate ?? '',
              interactId: i.postInteractId,
            })),
            catchError(() => of(null)),
          ),
        );

        return forkJoin(postCalls).pipe(
          map((results) => results.filter((r): r is LikedItem => r !== null)),
        );
      }),
      catchError(() => of([] as LikedItem[])),
    );

    forkJoin({ camps: camps$, posts: posts$ }).subscribe(({ camps, posts }) => {
      this.allItems = [...camps, ...posts].sort(
        (a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime(),
      );
    });
  }

  setActiveTab(tab: 'all' | 'camp' | 'post') {
    this.activeTab = tab;
    this.currentPage = 1;
  }

  unlike(item: LikedItem) {
    if (item.type === 'camp') {
      this.http
        .delete(`${this.campApiUrl}/${item.refId}`)
        .pipe(catchError(() => of(null)))
        .subscribe(() => {
          this.allItems = this.allItems.filter((i) => i.id !== item.id);
          this.currentPage = Math.min(this.currentPage, this.totalPages);
        });
    } else {
      if (item.interactId == null) return;
      this.sPostInteract
        .deletePostInteract(item.interactId)
        .pipe(catchError(() => of(null)))
        .subscribe(() => {
          this.allItems = this.allItems.filter((i) => i.id !== item.id);
          this.currentPage = Math.min(this.currentPage, this.totalPages);
        });
    }
  }

  get filteredItems(): LikedItem[] {
    if (this.activeTab === 'all') return this.allItems;
    return this.allItems.filter((i) => i.type === this.activeTab);
  }

  get normalizedDisplayCount(): number {
    const n = Number(this.displayCount);
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  }

  get totalFilteredCount(): number {
    return this.filteredItems.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFilteredCount / this.normalizedDisplayCount));
  }

  get pageStartItem(): number {
    return this.totalFilteredCount === 0
      ? 0
      : (this.currentPage - 1) * this.normalizedDisplayCount + 1;
  }

  get pageEndItem(): number {
    return Math.min(this.currentPage * this.normalizedDisplayCount, this.totalFilteredCount);
  }

  get displayedItems(): LikedItem[] {
    const start = (this.currentPage - 1) * this.normalizedDisplayCount;
    return this.filteredItems.slice(start, start + this.normalizedDisplayCount);
  }

  onDisplayCountChange() {
    this.displayCount = this.normalizedDisplayCount;
    this.currentPage = Math.min(this.currentPage, this.totalPages);
  }

  goToPreviousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  gotoPost(id: number) {
    this.router.navigate(['post', id]);
  }
}
