import { Sforum } from './../service/sforum';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IForum } from '../interfaces/Iforum';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { PopoverModule } from 'primeng/popover';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputTextModule } from 'primeng/inputtext';


@Component({
  selector: 'app-post',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TagModule,
    AvatarModule,
    ButtonModule,
    DividerModule,
    PopoverModule,
    InputGroupModule,
    InputTextModule
  ],
  templateUrl: './post.html',
  styleUrl: './post.scss',
})
export class Post implements OnInit {

  post: IForum | null = null;
  postId!: number;
  postRoute?: string = '';
  postMainPic?: string;
  constructor(private sforumService: Sforum, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.postId = Number(this.route.snapshot.paramMap.get('id'));
    this.postRoute = window.location.href;

    this.sforumService.getPostById(this.postId).subscribe({
      next: (data) => {
        this.post = data;
        console.log(this.post);
        if (this.post?.isHaveImgs && this.post?.moreImages?.length) {
          this.postMainPic = this.post.moreImages?.[0]?.imageUrl ?? '';
        }
      },
      error: (err) => console.error('載入文章失敗', err),
    });

  }

  getMainImage() {
    return this.postMainPic ? this.postMainPic : 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1920';
  }

  copyPostRoute(): void {
    if (this.postRoute) {
      navigator.clipboard.writeText(this.postRoute);
    }
  }

}
