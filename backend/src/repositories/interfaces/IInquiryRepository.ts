export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  interest?: string;
  message?: string;
  source?: string;
  rating?: number;
  status?: string;
  notes?: string;
  orderId?: string;
  productId?: string;
  productTitle?: string;
  productImage?: string;
  items?: any[];
  totalAmount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface IInquiryRepository {
  create(inquiry: Omit<Inquiry, 'createdAt'>): Promise<Inquiry>;
  list(): Promise<Inquiry[]>;
  findById(id: string): Promise<Inquiry | null>;
  update(id: string, updates: Partial<Inquiry>): Promise<Inquiry | null>;
  delete(id: string): Promise<boolean>;
}
