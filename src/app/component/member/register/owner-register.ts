import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../Service/member-service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-owner-register',
  imports: [FormsModule],
  templateUrl: './owner-register.html',
  styleUrl: './owner-register.css',
})
export class OwnerRegister {
  constructor(
    private memberService: MemberService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.ownerData.Name = this.memberService.getname();
  }
  ownerData = {
    Name: '',
    IdNumber: '',
    Address: '',
    ProfilePicture: '',
  };
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    this.selectedFile = input.files[0];

    // 預覽圖片
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  submitowner() {
    if (!this.selectedFile) {
      alert('請先選擇照片');
      return;
    }

    // 第一步：先送營主資訊
    this.memberService.ownerregister(this.ownerData).subscribe({
      next: (res) => {
        console.log('營主資訊上傳成功', res);

        // 第二步：營主資訊成功後，再上傳照片

        this.memberService.uploadOwnerProfilePhoto(this.selectedFile!).subscribe({
          next: (photoRes) => {
            console.log('照片上傳成功', photoRes);
            this.messageService.add({
              key: 'top-right',
              severity: 'success',
              summary: '註冊成功',
              detail: '營主資料與照片都上傳成功',
            });
            // alert('營主資料與照片都上傳成功');
          },
          error: (err) => {
            console.log('照片上傳失敗', err);
            this.messageService.add({
              key: 'top-right',
              severity: 'error',
              summary: `註冊失敗`,
              detail: '營主資料成功，但照片上傳失敗',
            });
            // alert('營主資料成功，但照片上傳失敗');
          },
        });
      },
      error: (err) => {
        console.log('營主資訊上傳失敗', err);
        console.log('照片上傳失敗', err);
        this.messageService.add({
          key: 'top-right',
          severity: 'error',
          summary: `註冊失敗`,
          detail: '營主資訊上傳失敗',
        });
        // alert('營主資訊上傳失敗');
      },
    });
  }
  GetRegistApi() {}
}
