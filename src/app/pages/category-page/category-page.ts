import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FilterBarComponent,
  FilterOptions,
  CategoryOption,
} from '../../components/filter-bar/filter-bar';
import { CategorySidebarComponent } from '../../components/category-sidebar/category-sidebar';
import { ProductGridComponent } from '../../components/product-grid/product-grid';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FilterBarComponent,
    CategorySidebarComponent,
    ProductGridComponent,
    MatIconModule,
  ],
  templateUrl: './category-page.html',
  styleUrl: './category-page.scss',
})
export class CategoryPage implements OnInit, OnDestroy {
  products: Product[] = [];
  categorySlug = '';
  pageTitle = '';
  categories: CategoryOption[] = [];
  totalCount = 0;
  hasMore = true;
  isLoading = false;
  isMobileFiltersOpen = false;

  private priceSort?: 'low-to-high' | 'high-to-low';
  private priceRange?: { min?: number; max?: number };

  constructor(
    private productService: ProductService,
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.productService.products$.subscribe((products: Product[]) => {
      this.products = products;
    });
    this.productService.getTotalCount().subscribe((count) => {
      this.totalCount = count;
    });
    this.productService.getHasMore().subscribe((hasMore) => {
      this.hasMore = hasMore;
    });
    this.productService.getIsLoading().subscribe((isLoading) => {
      this.isLoading = isLoading;
    });

    this.api.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats.map((c) => ({ name: c.name, slug: c.slug }));
      },
      error: () => {
        this.categories = [];
      },
    });

    this.route.params.subscribe((params) => {
      this.categorySlug = params['slug'];
      this.pageTitle = this.categorySlug;
      this.priceSort = undefined;
      this.priceRange = undefined;

      this.api.getCategory(this.categorySlug).subscribe({
        next: (cat) => {
          this.pageTitle = cat.name;
        },
        error: () => {
          this.pageTitle = this.categorySlug;
        },
      });

      this.applyProductFilters();
      this.closeMobileFilters();
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeClose(): void {
    this.closeMobileFilters();
  }

  openMobileFilters(): void {
    this.isMobileFiltersOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeMobileFilters(): void {
    if (!this.isMobileFiltersOpen) {
      return;
    }
    this.isMobileFiltersOpen = false;
    document.body.style.overflow = '';
  }

  onSidebarFilterChange(filters: FilterOptions): void {
    this.priceRange = filters.priceRange;
    this.applyProductFilters();
  }

  onSidebarReset(): void {
    this.priceRange = undefined;
    this.applyProductFilters();
  }

  onSortChange(filters: FilterOptions): void {
    this.priceSort = filters.priceSort;
    this.applyProductFilters();
  }

  onSortReset(): void {
    this.priceSort = undefined;
    this.applyProductFilters();
  }

  openProductDetail(product: Product) {
    this.router.navigate(['/product', product.id]);
  }

  onLoadMore() {
    this.productService.loadNextPage();
  }

  private applyProductFilters(): void {
    if (!this.categorySlug) {
      return;
    }
    this.productService.filterProducts([this.categorySlug], this.priceSort, this.priceRange);
  }
}
