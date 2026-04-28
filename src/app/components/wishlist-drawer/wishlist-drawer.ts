import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Wishlist } from '../../services/wishlist';
import { CartService } from '../../services/cart';
import { Product } from '../../models/product';

@Component({
  selector: 'app-wishlist-drawer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './wishlist-drawer.html',
  styleUrl: './wishlist-drawer.scss',
})
export class WishlistDrawerComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closeDrawer = new EventEmitter<void>();

  wishlistItems: Product[] = [];
  private subscription?: Subscription;

  constructor(
    private wishlistService: Wishlist,
    private cartService: CartService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.subscription = this.wishlistService.wishlistItems$.subscribe((items: Product[]) => {
      this.wishlistItems = items;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  close() {
    this.closeDrawer.emit();
  }

  removeItem(product: Product) {
    this.wishlistService.removeFromWishlist(product.id);
  }

  moveToCart(product: Product) {
    if (product.availableStock > 0) {
      this.cartService.addToCart(product, 1);
      this.wishlistService.removeFromWishlist(product.id);
    }
  }

  viewProduct(product: Product) {
    this.close();
    this.router.navigate(['/product', product.id]);
  }
}
