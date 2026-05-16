import { Category } from './category';

export interface Product {
  id: number;
  name: string;
  description?: string;
  /** API may return decimal strings (e.g. `"229.00"`). */
  originalPrice: number | string;
  salePrice?: number | string;
  images: string[];
  category: Category;
  newIn: boolean;
  noOfStock: number;
  availableStock: number; // Stock available after accounting for reservations
}
