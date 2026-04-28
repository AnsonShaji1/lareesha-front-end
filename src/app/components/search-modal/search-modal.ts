import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Product } from '../../models/product';
import { ApiService } from '../../services/api.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './search-modal.html',
  styleUrl: './search-modal.scss',
})
export class SearchModalComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchQuery = '';
  filteredProducts: Product[] = [];
  isLoading = false;
  hasSearched = false;
  private readonly searchInputSubject = new Subject<string>();
  private searchSubscription: Subscription;

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {
    this.searchSubscription = this.searchInputSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => this.performSearch(query));
  }

  ngOnDestroy(): void {
    this.searchSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      setTimeout(() => {
        if (this.searchInput) {
          this.searchInput.nativeElement.focus();
        }
      }, 100);
      return;
    }
    if (changes['isOpen'] && !this.isOpen) {
      this.resetSearchState();
    }
  }

  onSearch() {
    const query = this.searchQuery.trim();
    if (!query) {
      this.filteredProducts = [];
      this.isLoading = false;
      this.hasSearched = false;
      return;
    }
    this.searchInputSubject.next(query);
  }

  openProduct(productId: number): void {
    this.router.navigate(['/product', productId]);
    this.close();
  }

  close() {
    this.resetSearchState();
    this.closeModal.emit();
  }

  private performSearch(query: string): void {
    this.isLoading = true;
    this.hasSearched = true;
    this.apiService
      .getProducts({
        search: query,
        page: 1,
        pageSize: 25,
      })
      .subscribe({
        next: (products: Product[]) => {
          this.filteredProducts = products;
          this.isLoading = false;
        },
        error: () => {
          this.filteredProducts = [];
          this.isLoading = false;
        },
      });
  }

  private resetSearchState(): void {
    this.searchQuery = '';
    this.filteredProducts = [];
    this.isLoading = false;
    this.hasSearched = false;
  }
}
