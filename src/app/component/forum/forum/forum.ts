import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Sforum } from '../service/sforum';
import { SPostInteract } from '../service/sPostInteract';
import { IForum } from '../interfaces/Iforum';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-forum',
  imports: [CommonModule, ButtonModule],
  templateUrl: './forum.html',
  styleUrl: './forum.css',
})
export class Forum implements OnInit {
  posts: IForum[] = [];
  filteredPosts: IForum[] = [];
  selectedCategory: string | null = null;
  likeCountMap: Record<number, number> = {};

  categories = ['全部', '北部專區', '中部專區', '南部專區', '東部專區', '影音圖輯', '新手教學', '露營裝備', '天氣分享', '抱怨專區'];

  constructor(private sforumService: Sforum, private sPostInteractService: SPostInteract, private router: Router) { }

  ngOnInit(): void {
    this.sforumService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.filteredPosts = data;
      },
      error: (err) => console.error('載入文章失敗', err),
    });

    this.sPostInteractService.getPostInteracts(undefined, undefined, 1, 1000).subscribe({
      next: (interacts) => {
        const map: Record<number, number> = {};
        for (const item of interacts) {
          if (item.likePostId != null) {
            map[item.likePostId] = (map[item.likePostId] ?? 0) + 1;
          }
        }
        this.likeCountMap = map;
      },
      error: (err) => console.error('載入互動資料失敗', err),
    });
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category === '全部' ? null : category;
    this.filteredPosts = this.selectedCategory
      ? this.posts.filter(p => p.postCategoryName === this.selectedCategory)
      : this.posts;
  }

  getMainImage(post: IForum): string {
    if (post.isHaveImgs && post.moreImages && post.moreImages.length > 0) {
      return post.moreImages[0].imageUrl ?? '';
    }
    return 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=600';
  }

  gotoPost(id: number) {
    this.router.navigate(['post', id]);
  }

  addPost() {
    this.router.navigate(['post']);
  }

}
