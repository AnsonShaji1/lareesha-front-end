import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Product } from '../models/product';
import { ApiService, CartItemResponse } from './api.service';
import { AuthService } from './auth.service';

export interface CartItem {
  id?: number;
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartItems: CartItem[] = [];
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable();

  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  private itemAddedSubject = new Subject<void>();
  itemAdded$ = this.itemAddedSubject.asObservable();

  // Event emitted when user is not authenticated
  private authRequiredSubject = new Subject<void>();
  authRequired$ = this.authRequiredSubject.asObservable();

  // Event emitted when there's an error
  private errorSubject = new Subject<string>();
  error$ = this.errorSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
  ) {
    // Subscribe to auth state changes and reload cart when user logs in/signs out
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.loadCart();
      } else {
        // Clear cart when user signs out
        this.cartItems = [];
        this.updateCartState();
      }
    });
  }

  private loadCart(): void {
    if (!this.authService.isAuthenticated) {
      console.warn('Cannot load cart: user not authenticated');
      return;
    }
    this.apiService.getCart().subscribe({
      next: (items) => {
        this.cartItems = items.map((item) => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
        }));
        this.updateCartState();
      },
      error: (error) => {
        console.error('Error loading cart:', error);
      },
    });
  }

  addToCart(product: Product, quantity: number = 1): void {
    if (!this.authService.isAuthenticated) {
      this.authRequiredSubject.next();
      return;
    }

    this.apiService.addToCart(product.id, quantity).subscribe({
      next: (response) => {
        this.loadCart();
        this.itemAddedSubject.next();
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        const errorMessage = error?.error?.message || 'Failed to add item to cart';
        this.errorSubject.next(errorMessage);
      },
    });
  }

  removeFromCart(productId: number): void {
    if (!this.authService.isAuthenticated) {
      this.authRequiredSubject.next();
      return;
    }

    const item = this.cartItems.find((i) => i.product.id === productId);
    if (item && item.id) {
      this.apiService.removeFromCart(item.id).subscribe({
        next: () => {
          this.loadCart();
        },
        error: (error) => {
          console.error('Error removing from cart:', error);
        },
      });
    }
  }

  updateQuantity(productId: number, quantity: number): void {
    if (!this.authService.isAuthenticated) {
      this.authRequiredSubject.next();
      return;
    }

    const item = this.cartItems.find((i) => i.product.id === productId);
    if (item && item.id) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        this.apiService.updateCartItem(item.id, quantity).subscribe({
          next: () => {
            this.loadCart();
          },
          error: (error) => {
            console.error('Error updating cart:', error);
          },
        });
      }
    }
  }

  clearCart(): void {
    if (!this.authService.isAuthenticated) {
      this.authRequiredSubject.next();
      return;
    }

    this.apiService.clearCart().subscribe({
      next: () => {
        this.cartItems = [];
        this.updateCartState();
      },
      error: (error) => {
        console.error('Error clearing cart:', error);
      },
    });
  }

  getTotal(): number {
    return this.cartItems.reduce((total, item) => {
      const price = item.product.salePrice || item.product.originalPrice;
      return total + price * item.quantity;
    }, 0);
  }

  private updateCartState(): void {
    this.cartItemsSubject.next([...this.cartItems]);
    const totalCount = this.cartItems.reduce((count, item) => count + item.quantity, 0);
    this.cartCountSubject.next(totalCount);
  }

  refreshCart(): void {
    this.loadCart();
  }
}
