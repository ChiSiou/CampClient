import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { Sforum } from '../service/sforum';
import { IForum } from '../interfaces/Iforum';

interface UploadEvent {
  currentFiles: any;
  originalEvent: Event;
  files: File[];
}

@Component({
  selector: 'app-add-post',
  imports: [
    FormsModule,
    Toast,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    FileUploadModule,
  ],
  templateUrl: './add-post.html',
  styleUrl: './add-post.css',
  providers: [MessageService],
})
export class AddPost {
  // 資料
  new_userId: number = 1;
  new_title: string = '';
  new_mainContent: string = '';
  new_postCategoryId: number | null = null;
  new_postTag: string = '';
  new_isHaveImgs: boolean = false;

  categories = [
    { id: 1, name: '北部專區' },
    { id: 2, name: '中部專區' },
    { id: 3, name: '南部專區' },
    { id: 4, name: '東部專區' },
    { id: 5, name: '影音圖輯' },
    { id: 6, name: '新手教學' },
    { id: 7, name: '露營裝備' },
    { id: 8, name: '天氣分享' },
    { id: 9, name: '抱怨專區' },
  ];

  // 使用者傳圖
  private messageService = inject(MessageService);
  selectedFiles: File[] = [];
  uploadedImageUrls: string[] = [];

  postForm = {
    submitted: false,
    valid: false,
  };

  constructor(private sforumService: Sforum, private router: Router) { }

  ngOnInit(): void {
    this.new_userId = this.sforumService.getUserId();
  }

  onSelect(event: UploadEvent) {
    this.selectedFiles = event.currentFiles ?? (event as any).files;
  }

  onSubmit(form: any) {
    if (this.new_title.trim() && this.new_mainContent.trim() && this.new_postCategoryId) {
      form.valid = true;
    } else {
      form.valid = false;
    }

    if (!form.valid) {
      this.messageService.add({
        severity: 'error',
        summary: '發文失敗',
        detail: '請檢查必填欄位。',
        life: 3000,
      });
      return;
    }

    if (this.selectedFiles.length > 0) {
      this.uploadAllFiles().then(() => {
        this.addNewPost();
      });
    } else {
      this.addNewPost();
    }
  }

  async uploadAllFiles(): Promise<void> {
    this.uploadedImageUrls = [];
    for (const file of this.selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await this.sforumService.uploadImage(formData).toPromise();
      this.uploadedImageUrls.push(res.imageUrl);
    }
    this.new_isHaveImgs = true;
  }

  addNewPost() {
    const param: IForum = {
      postId: 0,
      userId: this.new_userId,
      title: this.new_title,
      mainContent: this.new_mainContent,
      postCategoryId: this.new_postCategoryId!,
      postTag: this.new_postTag,
      isHaveImgs: this.new_isHaveImgs,
      moreImages: this.uploadedImageUrls.map((url) => ({ imageUrl: url })),
    };

    this.sforumService.postPost(param).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: '發文成功',
          detail: '回到討論區頁面。',
          life: 3000,
        });
        this.router.navigate(['forum']);
      },
      error: (err) => {
        console.error('發文失敗', err);
        this.messageService.add({
          severity: 'error',
          summary: '發文失敗',
          detail: '請稍後再試。',
          life: 3000,
        });
      },
    });
  }
}
