import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FilterBarComponent, FilterOptions } from '../../components/filter-bar/filter-bar';
import { ProductGridComponent } from '../../components/product-grid/product-grid';
import { ProductService } from '../../services/product';
import { Product } from '../../models/product';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [CommonModule, FilterBarComponent, ProductGridComponent],
  templateUrl: './category-page.html',
  styleUrl: './category-page.scss',
})
export class CategoryPage implements OnInit {
  products: Product[] = [];
  categorySlug: string = '';
  pageTitle: string = '';
  totalCount = 0;
  hasMore = true;
  isLoading = false;

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

    this.route.params.subscribe((params) => {
      this.categorySlug = params['slug'];
      this.pageTitle = this.categorySlug;
      this.api.getCategory(this.categorySlug).subscribe({
        next: (cat) => {
          this.pageTitle = cat.name;
        },
        error: () => {
          // Keep fallback title (slug) if category lookup fails
          this.pageTitle = this.categorySlug;
        },
      });
      this.productService.filterProducts([this.categorySlug]);
    });
  }

  onFilterChange(filters: FilterOptions) {
    const categories =
      filters.categories && filters.categories.length > 0 ? filters.categories : [this.categorySlug];
    this.productService.filterProducts(categories, filters.priceSort, filters.priceRange);
  }

  onResetFilters() {
    this.productService.filterProducts([this.categorySlug]);
  }

  openProductDetail(product: Product) {
    this.router.navigate(['/product', product.id]);
  }

  onLoadMore() {
    this.productService.loadNextPage();
  }
}
