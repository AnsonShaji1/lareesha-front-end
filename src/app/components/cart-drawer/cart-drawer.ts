import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CartService, CartItem } from '../../services/cart';
import { AuthService } from '../../services/auth.service';
import { ApiService, StockValidationResponse } from '../../services/api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.scss',
})
export class CartDrawerComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() checkoutRequested = new EventEmitter<void>();
  @Output() authRequired = new EventEmitter<void>();

  cartItems: CartItem[] = [];
  total = 0;
  errorMessage = '';
  isValidating = false;
  private subscription?: Subscription;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private apiService: ApiService,
  ) {
    console.log('CartDrawer constructor called');
  }

  ngOnInit() {
    console.log('CartDrawer ngOnInit setting up subscriptions');
    console.log('checkoutRequested observers:', this.checkoutRequested.observers.length);
    this.subscription = this.cartService.cartItems$.subscribe((items: CartItem[]) => {
      this.cartItems = items;
      this.total = this.cartService.getTotal();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  close() {
    this.closeDrawer.emit();
  }

  removeItem(item: CartItem) {
    this.cartService.removeFromCart(item.product.id);
  }

  increaseQuantity(item: CartItem) {
    if (item.quantity < item.product.availableStock) {
      this.cartService.updateQuantity(item.product.id, item.quantity + 1);
    }
  }

  decreaseQuantity(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.product.id, item.quantity - 1);
    }
  }

  checkout() {
    console.log('=== CHECKOUT BUTTON CLICKED ===');
    console.log('Cart items:', this.cartItems);

    this.authService.isAuthenticated$
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          console.log('User is authenticated, validating stock before checkout');
          this.validateStockAndCheckout();
        } else {
          console.log('User not authenticated, requesting login');
          this.authRequired.emit();
        }
      })
      .unsubscribe();
  }

  private validateStockAndCheckout() {
    this.isValidating = true;

    this.apiService.validateCartStock().subscribe({
      next: (response: StockValidationResponse) => {
        this.isValidating = false;

        if (response.valid) {
          console.log('Stock validation passed, proceeding to checkout');
          this.checkoutRequested.emit();
        } else {
          console.log('Stock validation failed:', response);

          if (response.items && response.items.length > 0) {
            const itemDetails = response.items
              .map(
                (item) =>
                  `${item.product_name}: You requested ${item.requested}, but only ${item.available} available`,
              )
              .join('\\n');

            this.errorMessage = `${response.error || 'Insufficient stock'}\\n\\n${itemDetails}`;
          } else {
            this.errorMessage = response.error || 'Insufficient stock for some items';
          }
        }
      },
      error: (error) => {
        console.error('Error validating stock:', error);
        this.isValidating = false;
        this.errorMessage = 'Unable to validate stock. Please try again.';
      },
    });
  }
}
