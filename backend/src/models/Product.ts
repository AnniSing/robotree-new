export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  stockQuantity: number;
  sku: string;
  image: string;
  description: string;
  features?: string[];
  featured?: boolean;
  specifications?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreOrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface StoreOrder {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  items: StoreOrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
}
