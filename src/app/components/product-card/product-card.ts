import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Product } from '../../models/product';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
import { NotificationService } from '../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard implements OnInit, OnDestroy {
  @Input() product!: Product;
  @Output() authRequired = new EventEmitter<void>();

  private authRequiredSubscription?: Subscription;
  private itemAddedSubscription?: Subscription;
  private cartErrorSubscription?: Subscription;

  constructor(
    private cartService: CartService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.authRequiredSubscription = this.cartService.authRequired$.subscribe(() => {
      this.authRequired.emit();
    });

    // Listen for successful cart additions
    this.itemAddedSubscription = this.cartService.itemAdded$.subscribe(() => {
      this.notificationService.success('Added to cart');
    });

    // Listen for cart errors
    this.cartErrorSubscription = this.cartService.error$.subscribe((error) => {
      this.notificationService.error(error);
    });
  }

  ngOnDestroy() {
    this.authRequiredSubscription?.unsubscribe();
    this.itemAddedSubscription?.unsubscribe();
    this.cartErrorSubscription?.unsubscribe();
  }

  addToCart() {
    console.log('Adding to cart:', this.product.name);
    this.cartService.addToCart(this.product, 1);
  }
}
