import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../services/api.service';
import { Category } from '../../models/category';

@Component({
  selector: 'app-collections-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './collections-drawer.html',
  styleUrl: './collections-drawer.scss',
})
export class CollectionsDrawerComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeDrawer = new EventEmitter<void>();

  categories: Category[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
      },
      error: (err) => {
        console.error('CollectionsDrawer: failed to load categories', err);
        this.categories = [];
      },
    });
  }

  close() {
    this.closeDrawer.emit();
  }

  onCategoryClick() {
    // Close drawer when navigating to a category
    this.close();
  }
}
