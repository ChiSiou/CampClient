import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CampManagementService } from '../../../../services/camp-management.service';
import { CampgroundCreateDto } from '../../../../interfaces/camp-management.interface';

@Component({
  selector: 'app-camp-add',
  imports: [CommonModule, FormsModule],
  templateUrl: './camp-add.html',
  styleUrl: './camp-add.css',
})
export class CampAdd {
  form: CampgroundCreateDto = {
    name: '',
    phone: '',
    elevation: 0,
    description: '',
    website: '',
    basePrice: 0,
    area: '',
    latitude: 0,
    longitude: 0,
    rules: '',
    highlights: '',
    facilityIds: [],
    tagIds: [],
  };
  submitting = false;
  error = '';

  constructor(private campService: CampManagementService, private router: Router) {}

  submit() {
    if (!this.form.name.trim() || !this.form.area.trim()) {
      this.error = '請填寫必填欄位（名稱、地區）';
      return;
    }
    this.submitting = true;
    this.error = '';
    this.campService.createCampground(this.form).subscribe({
      next: (res) => this.router.navigate(['/ownerCenter/camps', res.id]),
      error: (err) => {
        this.error = err.error?.message ?? '建立失敗，請稍後再試';
        this.submitting = false;
      },
    });
  }

  cancel() {
    this.router.navigate(['/ownerCenter/camps']);
  }
}
