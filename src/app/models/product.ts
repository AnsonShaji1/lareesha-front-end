import { Category } from './category';

export interface Product {
  id: number;
  name: string;
  description?: string;
  originalPrice: number;
  salePrice?: number;
  images: string[];
  category: Category;
  newIn: boolean;
  noOfStock: number;
  availableStock: number; // Stock available after accounting for reservations
}
