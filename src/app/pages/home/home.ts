import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule, ViewportScroller } from '@angular/common';
import { FilterBarComponent, FilterOptions, CategoryOption } from '../../components/filter-bar/filter-bar';
import { ProductGridComponent } from '../../components/product-grid/product-grid';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FilterBarComponent, ProductGridComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  products: Product[] = [];
  totalCount = 0;
  hasMore = true;
  isLoading = false;
  categories: CategoryOption[] = [];

  constructor(
    private productService: ProductService,
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private viewportScroller: ViewportScroller,
  ) {}

  ngOnInit() {
    this.api.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats.map((c) => ({ name: c.name, slug: c.slug }));
      },
      error: (err) => {
        console.error('Home: failed to load categories', err);
        this.categories = [];
      },
    });

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
    this.productService.loadAllProducts();

    this.route.queryParams.subscribe((params) => {
      const sale = params['sale'];
      if (sale === 'true') {
        this.productService.resetFilters();
      }
    });
  }

  onFilterChange(filters: FilterOptions) {
    this.productService.filterProducts(filters.categories, filters.priceSort, filters.priceRange);
  }

  onResetFilters() {
    this.productService.resetFilters();
  }

  openProductDetail(product: Product) {
    this.router.navigate(['/product', product.id]);
  }

  onLoadMore() {
    this.productService.loadNextPage();
  }

  scrollToShop(): void {
    this.viewportScroller.setOffset([0, 0]);
    this.viewportScroller.scrollToAnchor('shop');
  }
}
