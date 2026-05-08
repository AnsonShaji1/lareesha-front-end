import { Component, EventEmitter, Output, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { AccountMenu } from '../account-menu/account-menu';
import { CollectionsDrawerComponent } from '../collections-drawer/collections-drawer';
import { WishlistDrawerComponent } from '../wishlist-drawer/wishlist-drawer';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart';
import { Wishlist } from '../../services/wishlist';
import { AuthService, User } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Category } from '../../models/category';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    AccountMenu,
    CollectionsDrawerComponent,
    WishlistDrawerComponent,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  cartItemCount = 0;
  wishlistItemCount = 0;
  isAccountMenuOpen = false;
  isCollectionsDrawerOpen = false;
  isWishlistDrawerOpen = false;
  isMobileNavOpen = false;
  isAuthenticated = false;
  currentUser: User | null = null;
  categories: Category[] = [];
  isMobileCategoriesOpen = false;

  private cartSubscription?: Subscription;
  private wishlistSubscription?: Subscription;
  private authSubscription?: Subscription;

  @Output() searchClick = new EventEmitter<void>();
  @Output() signInClick = new EventEmitter<void>();
  @Output() cartClick = new EventEmitter<void>();

  constructor(
    private cartService: CartService,
    private wishlistService: Wishlist,
    private authService: AuthService,
    private api: ApiService,
  ) {}

  ngOnInit() {
    this.cartSubscription = this.cartService.cartCount$.subscribe((count: number) => {
      this.cartItemCount = count;
    });

    this.wishlistSubscription = this.wishlistService.wishlistCount$.subscribe((count: number) => {
      this.wishlistItemCount = count;
    });

    this.authSubscription = this.authService.isAuthenticated$.subscribe((isAuth: boolean) => {
      this.isAuthenticated = isAuth;
    });

    this.authService.currentUser$.subscribe((user: User | null) => {
      this.currentUser = user;
    });

    this.api.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
      },
      error: (err) => {
        console.error('Header: failed to load categories', err);
        this.categories = [];
      },
    });
  }

  ngOnDestroy() {
    this.cartSubscription?.unsubscribe();
    this.wishlistSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeCloseMobile(): void {
    if (this.isMobileNavOpen) {
      this.closeMobileNav();
    }
  }

  toggleMobileNav(): void {
    this.isMobileNavOpen = !this.isMobileNavOpen;
    document.body.style.overflow = this.isMobileNavOpen ? 'hidden' : '';
  }

  closeMobileNav(): void {
    if (!this.isMobileNavOpen) {
      return;
    }
    this.isMobileNavOpen = false;
    this.isMobileCategoriesOpen = false;
    document.body.style.overflow = '';
  }

  toggleMobileCategories(): void {
    this.isMobileCategoriesOpen = !this.isMobileCategoriesOpen;
  }

  onMobileCategoryClick(): void {
    this.closeMobileNav();
  }

  onMobileCollections(): void {
    this.isCollectionsDrawerOpen = true;
    this.closeMobileNav();
  }

  getUserInitial(): string {
    if (this.currentUser?.first_name) {
      return this.currentUser.first_name.charAt(0).toUpperCase();
    }
    if (this.currentUser?.email) {
      return this.currentUser.email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  onSearchClick() {
    console.log('Search icon clicked in header');
    this.searchClick.emit();
  }

  onAccountClick() {
    console.log('Account icon clicked');
    if (!this.isAuthenticated) {
      this.signInClick.emit();
      return;
    }
    this.isAccountMenuOpen = !this.isAccountMenuOpen;
  }

  closeAccountMenu() {
    this.isAccountMenuOpen = false;
  }

  onCartClick() {
    console.log('Cart icon clicked');
    if (!this.isAuthenticated) {
      console.log('User not authenticated, opening sign in');
      this.signInClick.emit();
      return;
    }
    this.cartClick.emit();
  }

  onWishlistClick() {
    console.log('Wishlist icon clicked');
    if (!this.isAuthenticated) {
      console.log('User not authenticated, opening sign in');
      this.signInClick.emit();
      return;
    }
    this.isWishlistDrawerOpen = !this.isWishlistDrawerOpen;
  }

  closeWishlistDrawer() {
    this.isWishlistDrawerOpen = false;
  }

  onCollectionsClick() {
    console.log('Collections button clicked');
    this.isCollectionsDrawerOpen = true;
  }

  closeCollectionsDrawer() {
    this.isCollectionsDrawerOpen = false;
  }
}
