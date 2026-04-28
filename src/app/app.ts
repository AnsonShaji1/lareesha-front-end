import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header';
import { SearchModalComponent } from './components/search-modal/search-modal';
import { AuthModalComponent } from './components/auth-modal/auth-modal';
import { ForgotPasswordModalComponent } from './components/forgot-password-modal/forgot-password-modal';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer';
import { SiteFooterComponent } from './components/site-footer/site-footer';
import { ProductService } from './services/product';
import { CartDrawerService } from './services/cart-drawer.service';
import { CartService } from './services/cart';
import { Wishlist } from './services/wishlist';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    SearchModalComponent,
    AuthModalComponent,
    ForgotPasswordModalComponent,
    CartDrawerComponent,
    SiteFooterComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  title = 'Lareesha Luxe';
  isSearchOpen = false;
  isAuthModalOpen = false;
  isForgotPasswordOpen = false;
  isCartOpen = false;
  authMode: 'signin' | 'signup' = 'signin';
  private pendingCheckout = false;
  private cartDrawerSubscription?: Subscription;
  private itemAddedSubscription?: Subscription;
  private cartAuthRequiredSubscription?: Subscription;
  private wishlistAuthRequiredSubscription?: Subscription;

  constructor(
    private productService: ProductService,
    private cartDrawerService: CartDrawerService,
    private cartService: CartService,
    private wishlistService: Wishlist,
    private router: Router,
  ) {
    console.log('App constructor wishlistService:', this.wishlistService);
  }

  ngOnInit() {
    this.productService.products$.subscribe();

    this.cartDrawerSubscription = this.cartDrawerService.isopen$.subscribe((isOpen) => {
      console.log('Cart drawer state changed:', isOpen);
      this.isCartOpen = isOpen;
      console.log('isCartopen is now:', this.isCartOpen);
    });

    this.itemAddedSubscription = this.cartService.itemAdded$.subscribe(() => {
      console.log('Item added to cart, opening drawer');
      this.isCartOpen = true;
    });

    // Listen for auth required events from cart
    this.cartAuthRequiredSubscription = this.cartService.authRequired$.subscribe(() => {
      console.log('Cart: Auth required');
      this.openSignIn();
    });

    // Listen for auth required events from wishlist
    this.wishlistAuthRequiredSubscription = this.wishlistService.authRequired$.subscribe(() => {
      console.log('Wishlist: Auth required');
      this.openSignIn();
    });
  }

  ngOnDestroy() {
    this.cartDrawerSubscription?.unsubscribe();
    this.itemAddedSubscription?.unsubscribe();
    this.cartAuthRequiredSubscription?.unsubscribe();
    this.wishlistAuthRequiredSubscription?.unsubscribe();
  }

  openSearch() {
    this.isSearchOpen = true;
  }

  closeSearch() {
    this.isSearchOpen = false;
  }

  openSignIn() {
    this.authMode = 'signin';
    this.isAuthModalOpen = true;
  }

  openSignUp() {
    this.authMode = 'signup';
    this.isAuthModalOpen = true;
  }

  closeAuthModal() {
    this.isAuthModalOpen = false;
  }

  openForgotPassword() {
    this.isAuthModalOpen = false;
    this.isForgotPasswordOpen = true;
  }

  closeForgotPassword() {
    this.isForgotPasswordOpen = false;
  }

  backToSignIn() {
    this.isForgotPasswordOpen = false;
    this.openSignIn();
  }

  onAuthenticated(userData: any) {
    console.log('User authenticated:', userData);
    this.closeAuthModal();
    if (this.pendingCheckout) {
      this.pendingCheckout = false;
      setTimeout(() => {
        this.goToCheckout();
      }, 500);
    }
  }

  openCart() {
    console.log('openCart() called');
    this.isCartOpen = true;
  }

  closeCart() {
    this.cartDrawerService.close();
  }

  goToCheckout() {
    const timestamp = new Date().toISOString();
    console.log('=== goToCheckout() called at', timestamp, '===');
    this.isCartOpen = false;
    console.log('Cart closed, isCartOpen:', this.isCartOpen);
    console.log('Navigating to /checkout');
    this.router.navigate(['/checkout']).then((success) => {
      console.log('Navigation result:', success);
    });
  }

  handleAuthRequired() {
    console.log('=== Authentication required for checkout ===');
    this.isCartOpen = false;
    this.pendingCheckout = true;
    this.openSignIn();
  }
}
