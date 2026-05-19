import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Category } from '../../../models/category';
import { toTitleCase } from '../../../utils/text';

@Component({
  selector: 'app-home-category-grid',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-category-grid.html',
  styleUrl: './home-category-grid.scss',
})
export class HomeCategoryGridComponent {
  @Input() categories: Category[] = [];
  @Input() isLoading = false;

  readonly toTitleCase = toTitleCase;

  readonly placeholderSrc =
    'data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500"><rect fill="#f0e8dc" width="400" height="500"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b6b6b" font-family="sans-serif" font-size="18">Collection</text></svg>',
    );
}
