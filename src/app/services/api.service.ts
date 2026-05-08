import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Product } from '../models/product';
import { Category } from '../models/category';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProductListParams {
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  priceSort?: 'low-to-high' | 'high-to-low';
  search?: string;
  newIn?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CartItemResponse {
  id: number;
  product: Product;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface WishlistItemResponse {
  id: number;
  product: Product;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_price: number | string;
  product_url?: string;
  product_image?: string;
  quantity: number;
  line_total: number | string;
}

export interface Order {
  id: number;
  order_number: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  phone?: string;
  subtotal: number | string;
  shipping: number | string;
  tax: number | string;
  total: number | string;
  status: string;
  payment_status: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  stock_reserved: boolean;
  reservation_expires_at?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrderResponse extends Order {
  razorpay_key: string;
  amount: number;
}

export interface PaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface CreateOrderRequest {
  shipping_address_id: number;
}

export interface StockValidationItem {
  product_id: number;
  product_name: string;
  requested: number;
  available: number;
}

export interface StockValidationResponse {
  valid: boolean;
  error?: string;
  items?: StockValidationItem[];
}

export interface CalculateTotalsResponse {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shipping_pending_address?: boolean;
  shipping_zone?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  getProducts(paramsInput: ProductListParams = {}): Observable<Product[]> {
    return this.getProductsPage(paramsInput).pipe(map((response) => response.results));
  }

  getCategories(): Observable<Category[]> {
    return this.http
      .get<
        | Array<{ id: number; name: string; slug: string; image_url?: string | null }>
        | PaginatedResponse<{ id: number; name: string; slug: string; image_url?: string | null }>
      >(`${this.baseUrl}/categories/`, { withCredentials: true })
      .pipe(
        map((payload) => {
          const items = Array.isArray(payload) ? payload : payload.results;
          return items.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            imageUrl: c.image_url ?? null,
          }));
        }),
      );
  }

  getCategory(slug: string): Observable<Category> {
    return this.http
      .get<{ id: number; name: string; slug: string; image_url?: string | null }>(
        `${this.baseUrl}/categories/${encodeURIComponent(slug)}/`,
        { withCredentials: true },
      )
      .pipe(
        map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: c.image_url ?? null,
        })),
      );
  }

  getProductsPage(paramsInput: ProductListParams = {}): Observable<PaginatedResponse<Product>> {
    const { categories, minPrice, maxPrice, priceSort, search, newIn, page, pageSize } = paramsInput;
    let params = new HttpParams();
    if (categories && categories.length > 0) {
      categories.forEach((cat) => {
        params = params.append('category', cat);
      });
    }
    if (minPrice !== undefined) {
      params = params.set('min_price', minPrice.toString());
    }
    if (maxPrice !== undefined) {
      params = params.set('max_price', maxPrice.toString());
    }
    if (priceSort) {
      params = params.set('price_sort', priceSort);
    }
    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }
    if (newIn !== undefined) {
      params = params.set('new_in', String(newIn));
    }
    if (page !== undefined) {
      params = params.set('page', page.toString());
    }
    if (pageSize !== undefined) {
      params = params.set('page_size', pageSize.toString());
    }
    return this.http
      .get<PaginatedResponse<Product>>(`${this.baseUrl}/products/`, {
        params,
        withCredentials: true,
      });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${id}/`, {
      withCredentials: true,
    });
  }

  getCart(): Observable<CartItemResponse[]> {
    return this.http
      .get<PaginatedResponse<CartItemResponse>>(`${this.baseUrl}/cart/`, {
        withCredentials: true,
      })
      .pipe(map((response) => response.results));
  }

  addToCart(productId: number, quantity: number = 1): Observable<CartItemResponse> {
    return this.http.post<CartItemResponse>(
      `${this.baseUrl}/cart/`,
      {
        product_id: productId,
        quantity,
      },
      { withCredentials: true },
    );
  }

  updateCartItem(itemId: number, quantity: number): Observable<CartItemResponse> {
    return this.http.put<CartItemResponse>(
      `${this.baseUrl}/cart/${itemId}/`,
      { quantity },
      { withCredentials: true },
    );
  }

  removeFromCart(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cart/${itemId}/`, {
      withCredentials: true,
    });
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cart/clear/`, {
      withCredentials: true,
    });
  }

  getCartTotal(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.baseUrl}/cart/total/`, {
      withCredentials: true,
    });
  }

  validateCartStock(): Observable<StockValidationResponse> {
    return this.http.post<StockValidationResponse>(
      `${this.baseUrl}/cart/validate_stock/`,
      {},
      { withCredentials: true },
    );
  }

  getWishlist(): Observable<WishlistItemResponse[]> {
    return this.http
      .get<
        PaginatedResponse<WishlistItemResponse>
      >(`${this.baseUrl}/wishlist/`, { withCredentials: true })
      .pipe(map((response) => response.results));
  }

  addToWishlist(productId: number): Observable<WishlistItemResponse> {
    return this.http.post<WishlistItemResponse>(
      `${this.baseUrl}/wishlist/`,
      { product_id: productId },
      { withCredentials: true },
    );
  }

  removeFromWishlist(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/wishlist/${itemId}/`, {
      withCredentials: true,
    });
  }

  toggleWishlist(productId: number): Observable<{ in_wishlist: boolean }> {
    return this.http.post<{ in_wishlist: boolean }>(
      `${this.baseUrl}/wishlist/toggle/`,
      { product_id: productId },
      { withCredentials: true },
    );
  }

  checkWishlist(productId: number): Observable<{ in_wishlist: boolean }> {
    const params = new HttpParams().set('product_id', productId.toString());
    return this.http.get<{ in_wishlist: boolean }>(`${this.baseUrl}/wishlist/check/`, {
      params,
      withCredentials: true,
    });
  }

  clearWishlist(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/wishlist/clear/`, {
      withCredentials: true,
    });
  }

  createOrder(orderData: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(`${this.baseUrl}/orders/create_order/`, orderData, {
      withCredentials: true,
    });
  }

  verifyPayment(paymentData: PaymentVerificationRequest): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders/verify_payment/`, paymentData, {
      withCredentials: true,
    });
  }

  paymentFailed(razorpayOrderId: string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/orders/payment_failed/`,
      {
        razorpay_order_id: razorpayOrderId,
      },
      { withCredentials: true },
    );
  }

  getOrders(filters?: { [key: string]: string }): Observable<Order[]> {
    let params = new HttpParams();
    if (filters) {
      for (const key in filters) {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      }
    }
    return this.http
      .get<PaginatedResponse<Order>>(`${this.baseUrl}/orders/`, {
        params,
        withCredentials: true,
      })
      .pipe(map((response) => response.results));
  }

  getOrder(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${orderId}/`, {
      withCredentials: true,
    });
  }

  calculateTotals(shippingAddressId?: number): Observable<CalculateTotalsResponse> {
    const payload = shippingAddressId ? { shipping_address_id: shippingAddressId } : {};
    return this.http.post<CalculateTotalsResponse>(
      `${this.baseUrl}/orders/calculate_checkout_totals/`,
      payload,
      { withCredentials: true },
    );
  }

  updateUserProfile(profileData: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    gender?: string;
  }): Observable<any> {
    return this.http.patch(`${this.baseUrl}/auth/user/`, profileData, {
      withCredentials: true,
    });
  }
}
