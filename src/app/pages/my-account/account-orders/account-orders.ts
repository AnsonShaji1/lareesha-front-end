import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { ApiService, Order } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';
import { OrderFiltersComponent, FilterOptions } from '../orders-filters/order-filters';
import { BreadcrumbComponent } from '../../../components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-account-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    OrderFiltersComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './account-orders.html',
  styleUrl: './account-orders.scss',
})
export class AccountOrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = false;
  isMobileFiltersOpen = false;
  searchQuery = '';
  activeFilters: FilterOptions = {
    orderStatuses: [],
    orderPeriods: [],
  };

  // Status map matching backend exactly
  statusMap: { [key: string]: { label: string; color: string } } = {
    pending: { label: 'Pending', color: 'warning' },
    on_the_way: { label: 'On the Way', color: 'info' },
    shipped: { label: 'Shipped', color: 'info' },
    delivered: { label: 'Delivered', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'danger' },
  };

  // Payment status map matching backend exactly
  paymentStatusMap: { [key: string]: { label: string; color: string } } = {
    pending: { label: 'Pending', color: 'warning' },
    authorized: { label: 'Authorized', color: 'info' },
    captured: { label: 'Paid', color: 'success' },
    failed: { label: 'Failed', color: 'danger' },
    refunded: { label: 'Refunded', color: 'warning' },
  };

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders(filters?: FilterOptions, search?: string) {
    this.isLoading = true;
    const queryParams: { [key: string]: string } = {};

    // Add status filters
    if (filters?.orderStatuses && filters.orderStatuses.length > 0) {
      queryParams['status'] = filters.orderStatuses.join(',');
    }

    // Add date range filters
    if (filters?.orderPeriods && filters.orderPeriods.length > 0) {
      const dateRanges = this.getDateRangesForPeriods(filters.orderPeriods);
      if (dateRanges.startDate) queryParams['start_date'] = dateRanges.startDate;
      if (dateRanges.endDate) queryParams['end_date'] = dateRanges.endDate;
    }

    // Add search query
    if (search && search.trim()) {
      queryParams['search'] = search.trim();
    }

    // Call API with filters
    this.apiService.getOrders(queryParams).subscribe({
      next: (response: any) => {
        this.filteredOrders = response;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.notificationService.error('Failed to load orders');
        this.isLoading = false;
      },
    });
  }

  private getDateRangesForPeriods(periods: string[]): { startDate?: string; endDate?: string } {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    for (const period of periods) {
      const periodStart = new Date();
      const periodEnd = new Date(now);

      switch (period) {
        case 'last_30_days':
          periodStart.setDate(periodStart.getDate() - 30);
          if (!startDate || periodStart < startDate) startDate = periodStart;
          if (!endDate || periodEnd > endDate) endDate = periodEnd;
          break;

        case '2024':
          periodStart.setFullYear(2024, 0, 1);
          periodEnd.setFullYear(2024, 11, 31);
          if (!startDate || periodStart < startDate) startDate = periodStart;
          if (!endDate || periodEnd > endDate) endDate = periodEnd;
          break;

        case '2023':
          periodStart.setFullYear(2023, 0, 1);
          periodEnd.setFullYear(2023, 11, 31);
          if (!startDate || periodStart < startDate) startDate = periodStart;
          if (!endDate || periodEnd > endDate) endDate = periodEnd;
          break;

        case 'older':
          // For older, we set a very old start date
          periodStart.setFullYear(2000, 0, 1);
          periodEnd.setFullYear(2022, 11, 31);
          if (!startDate || periodStart < startDate) startDate = periodStart;
          if (!endDate || periodEnd > endDate) endDate = periodEnd;
          break;
      }
    }

    return {
      startDate: startDate ? startDate.toISOString().split('T')[0] : undefined,
      endDate: endDate ? endDate.toISOString().split('T')[0] : undefined,
    };
  }

  onSearch() {
    this.loadOrders(this.activeFilters, this.searchQuery);
  }

  onFilterChange(filters: FilterOptions) {
    this.activeFilters = filters;
    if (this.isMobileFiltersOpen) {
      this.closeMobileFilters();
    }
    this.loadOrders(filters, this.searchQuery);
  }

  openMobileFilters() {
    this.isMobileFiltersOpen = true;
  }

  closeMobileFilters() {
    this.isMobileFiltersOpen = false;
  }

  getStatusInfo(status: string) {
    return this.statusMap[status] || { label: status, color: 'default' };
  }

  getPaymentStatusInfo(status: string) {
    return this.paymentStatusMap[status] || { label: status, color: 'default' };
  }

  formatCurrency(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numValue);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  }

  getOrderMessage(order: Order): string {
    const statusMessages: { [key: string]: string } = {
      pending: 'Waiting for your payment confirmation',
      on_the_way: 'Your order has been placed successfully',
      shipped: 'Your order has been shipped',
      delivered: 'Your order has been delivered successfully',
      cancelled: 'Your order has been cancelled as payment was not confirmed by the bank',
    };

    return statusMessages[order.status] || 'View order details';
  }
}
