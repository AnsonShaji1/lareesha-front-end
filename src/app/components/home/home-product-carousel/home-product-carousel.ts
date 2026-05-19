import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../../../models/product';
import { ProductCard } from '../../product-card/product-card';
import { toTitleCase } from '../../../utils/text';

@Component({
  selector: 'app-home-product-carousel',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCard],
  templateUrl: './home-product-carousel.html',
  styleUrl: './home-product-carousel.scss',
})
export class HomeProductCarouselComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() title = '';
  @Input() products: Product[] = [];
  @Input() totalCount = 0;
  @Input() isLoading = false;
  @Input() viewAllLink: string | string[] = '/';
  @Input() loadingMessage = 'Loading products…';
  @Input() emptyMessage = 'No products available.';
  @Input() sectionBottomSpacing = false;

  @Output() productClick = new EventEmitter<Product>();

  @ViewChild('viewport') viewportRef?: ElementRef<HTMLElement>;

  currentIndex = 0;
  itemsPerView = 4;
  slideWidthPx = 0;

  private resizeObserver?: ResizeObserver;
  private layoutFrame?: number;

  get sectionId(): string {
    return this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  ngAfterViewInit(): void {
    this.scheduleLayoutUpdate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['products'] || changes['isLoading']) {
      if (changes['products'] && !changes['products'].firstChange) {
        this.currentIndex = 0;
      }
      this.scheduleLayoutUpdate();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    if (this.layoutFrame !== undefined) {
      cancelAnimationFrame(this.layoutFrame);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.scheduleLayoutUpdate();
  }

  get maxIndex(): number {
    return Math.max(0, this.products.length - this.itemsPerView);
  }

  get canGoPrev(): boolean {
    return this.currentIndex > 0;
  }

  get canGoNext(): boolean {
    return this.slideWidthPx > 0 && this.currentIndex < this.maxIndex;
  }

  get trackTransform(): string {
    if (!this.slideWidthPx) {
      return 'translate3d(0, 0, 0)';
    }
    return `translate3d(-${this.currentIndex * this.slideWidthPx}px, 0, 0)`;
  }

  get showNav(): boolean {
    return this.products.length > this.itemsPerView;
  }

  /** Fewer products than visible slots — centered row, same card width as carousel. */
  get usePartialRow(): boolean {
    return !this.showNav && this.products.length > 0;
  }

  get showViewAll(): boolean {
    return this.totalCount > 0;
  }

  get displayTitle(): string {
    return toTitleCase(this.title);
  }

  get carouselLabel(): string {
    return `${this.displayTitle} products`;
  }

  prev(): void {
    if (this.canGoPrev) {
      this.currentIndex -= 1;
    }
  }

  next(): void {
    if (this.canGoNext) {
      this.currentIndex += 1;
    }
  }

  private scheduleLayoutUpdate(): void {
    if (this.layoutFrame !== undefined) {
      cancelAnimationFrame(this.layoutFrame);
    }
    this.layoutFrame = requestAnimationFrame(() => {
      this.layoutFrame = requestAnimationFrame(() => {
        this.layoutFrame = undefined;
        this.updateLayout();
        this.attachResizeObserver();
      });
    });
  }

  private attachResizeObserver(): void {
    const el = this.viewportRef?.nativeElement;
    if (!el || typeof ResizeObserver === 'undefined') {
      return;
    }
    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.updateLayout());
    }
    this.resizeObserver.disconnect();
    this.resizeObserver.observe(el);
  }

  private updateLayout(): void {
    const viewport = this.viewportRef?.nativeElement;
    if (!viewport || this.isLoading || !this.products.length) {
      return;
    }

    const width = viewport.clientWidth;
    if (width <= 0) {
      return;
    }

    if (width < 480) {
      this.itemsPerView = 2;
    } else if (width < 900) {
      this.itemsPerView = 3;
    } else {
      this.itemsPerView = 4;
    }

    this.slideWidthPx = width / this.itemsPerView;
    const slideWidth = `${this.slideWidthPx}px`;
    viewport.style.setProperty('--slide-width', slideWidth);
    viewport.style.setProperty('--items-per-view', String(this.itemsPerView));

    const track = viewport.querySelector('.home-product-carousel__track');
    track?.querySelectorAll<HTMLElement>('.home-product-carousel__slide').forEach((slide) => {
      slide.style.flexBasis = slideWidth;
      slide.style.width = slideWidth;
      slide.style.maxWidth = slideWidth;
      slide.style.minWidth = slideWidth;
    });

    if (this.currentIndex > this.maxIndex) {
      this.currentIndex = this.maxIndex;
    }
  }
}
