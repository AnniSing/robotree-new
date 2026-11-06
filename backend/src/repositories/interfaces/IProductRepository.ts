import { Product, StoreOrder } from '../../models/Product.js';

export interface IProductRepository {
  list(options?: { category?: string; search?: string; inStockOnly?: boolean }): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  create(product: Product): Promise<Product>;
  update(id: string, updates: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
  createOrder(order: StoreOrder): Promise<StoreOrder>;
  listOrders(): Promise<StoreOrder[]>;
}
