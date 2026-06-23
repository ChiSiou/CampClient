import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../Service/member-service';

@Component({
  selector: 'app-memberedit',
  imports: [FormsModule],
  templateUrl: './memberedit.html',
  styleUrl: './memberedit.css',
})
export class Memberedit {
  memberData = {
    Name: '',
    Phone: '',
    Email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  constructor(private memberservice: MemberService) {}
  ngOnInit(): void {
    this.memberData.Name = this.memberservice.getname();
    this.memberData.Email = this.memberservice.getemail();
    this.memberData.Phone = this.memberservice.getphone();
  }
  submitEdit() {
    // 如果有輸入新密碼，就要檢查確認密碼
    if (this.memberData.newPassword || this.memberData.confirmPassword) {
      if (!this.memberData.oldPassword) {
        alert('請輸入舊密碼');
        return;
      }

      if (!this.memberData.newPassword) {
        alert('請輸入新密碼');
        return;
      }

      if (!this.memberData.confirmPassword) {
        alert('請輸入確認密碼');
        return;
      }

      if (this.memberData.newPassword !== this.memberData.confirmPassword) {
        alert('新密碼與確認密碼不一致');
        return;
      }
    }

    const formData = new FormData();

    formData.append('Name', this.memberData.Name);
    formData.append('Phone', this.memberData.Phone);

    if (this.memberData.oldPassword && this.memberData.newPassword) {
      formData.append('oldPassword', this.memberData.oldPassword);
      formData.append('newPassword', this.memberData.newPassword);
    }

    this.memberservice.memberEdit(formData).subscribe({
      next: (res) => {
        console.log(res);
        alert('修改成功');
      },
      error: (err) => {
        console.log(err);
        alert('修改失敗');
      },
    });
  }
}
