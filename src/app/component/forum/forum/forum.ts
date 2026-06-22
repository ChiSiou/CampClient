import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Sforum } from '../service/sforum';
import { IForum } from '../interfaces/Iforum';

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

  categories = ['全部', '北部專區', '中部專區', '南部專區', '東部專區', '影音圖輯', '新手教學', '露營裝備', '天氣分享', '抱怨專區'];

  constructor(private sforumService: Sforum) { }

  ngOnInit(): void {
    this.sforumService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.filteredPosts = data;
      },
      error: (err) => console.error('載入文章失敗', err),
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
}
