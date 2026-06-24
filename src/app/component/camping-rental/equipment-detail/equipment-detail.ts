import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EquipmentRentalService } from '../../../services/equipment-rental.service';
import { EquipmentCartService } from '../../../services/equipment-cart.service';
import { EquipmentDetailDto } from '../../../interfaces/camp.interface';

@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './equipment-detail.html',
  styleUrls: ['./equipment-detail.css'],
})
export class EquipmentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private equipmentRentalService = inject(EquipmentRentalService);
  cart = inject(EquipmentCartService);

  detail = signal<EquipmentDetailDto | null>(null);
  loading = signal(true);
  notFound = signal(false);
  private campgroundId = 0;

  ngOnInit(): void {
    this.campgroundId = Number(this.route.snapshot.paramMap.get('id')) || 0;
    const productId = Number(this.route.snapshot.paramMap.get('productId'));
    this.equipmentRentalService.getEquipmentDetail(productId).subscribe({
      next: (d) => {
        this.detail.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  getQuantity(variantId: number): number {
    return this.cart.getQuantity(variantId);
  }

  changeQuantity(variantId: number, delta: number, maxStock: number): void {
    const next = this.getQuantity(variantId) + delta;
    this.cart.setQuantity(variantId, Math.min(Math.max(next, 0), maxStock));
  }

  backToList(): void {
    this.router.navigate(['/camp', this.campgroundId, 'rental'], {
      queryParams: this.route.snapshot.queryParams,
    });
  }
}
