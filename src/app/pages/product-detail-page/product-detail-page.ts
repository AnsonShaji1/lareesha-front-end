import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { Wishlist } from '../../services/wishlist';
import { Product } from '../../models/product';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './product-detail-page.html',
  styleUrl: './product-detail-page.scss',
})
export class ProductDetailPage implements OnInit {
  product: Product | null = null;
  currentImage = '';
  quantity = 1;
  isInWishlist = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private wishlistService: Wishlist,
    private apiService: ApiService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const productId = +params['id'];
      this.productService.getProductById(productId).subscribe({
        next: (product: Product) => {
          this.product = product;
          if (this.product.images && this.product.images.length > 0) {
            this.currentImage = this.product.images[0];
          }
          // Check wishlist status from API if user is authenticated
          this.checkWishlistStatus(productId);
        },
        error: (error: any) => {
          console.error('Error loading product:', error);
          this.product = null;
        },
      });
    });
  }

  checkWishlistStatus(productId: number) {
    // If user is not authenticated, skip API call
    if (!this.authService.isAuthenticated) {
      this.isInWishlist = false;
      return;
    }

    // Make API call to check wishlist status
    this.apiService.checkWishlist(productId).subscribe({
      next: (response) => {
        this.isInWishlist = response.in_wishlist ?? false;
      },
      error: (error) => {
        console.error('Error checking wishlist status:', error);
      },
    });
  }

  selectImage(image: string) {
    this.currentImage = image;
  }

  increaseQuantity() {
    if (this.product && this.quantity < this.product.noOfStock) {
      this.quantity++;
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart() {
    if (!this.product || this.product.noOfStock === 0) {
      return;
    }
    this.cartService.addToCart(this.product, this.quantity);
    this.router.navigate(['/']);
  }

  toggleWishlist() {
    if (!this.product) return;

    // If not authenticated, let the user know
    if (!this.authService.isAuthenticated) {
      return;
    }

    // Then update the API based on the new value
    this.apiService.toggleWishlist(this.product.id).subscribe({
      next: (response) => {
        // Sync with API response if needed
        this.isInWishlist = response.in_wishlist;
        // Refresh the wishlist service to update the toolbar count
        this.wishlistService.refreshWishlist();
      },
      error: (error) => {
        console.error('Error toggling wishlist:', error);
      },
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
