import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string().min(2, 'Product title is required').max(150),
  category: z.string().min(2, 'Category is required'),
  price: z.coerce.number().positive('Price must be greater than zero'),
  originalPrice: z.coerce.number().positive().optional(),
  inStock: z.boolean().default(true),
  stockQuantity: z.coerce.number().int().min(0).default(10),
  sku: z.string().optional(),
  image: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  fileBase64: z.string().optional(),
  fileOriginalName: z.string().optional(),
  specs: z.record(z.string(), z.string()).optional(),
  removeImage: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const createStoreOrderSchema = z.object({
  customerName: z.string().min(2, 'Name is required').max(100),
  customerEmail: z.string().email('Valid email required').optional(),
  email: z.string().email('Valid email required').optional(),
  customerPhone: z.string().min(6, 'Valid phone required').optional(),
  phone: z.string().min(6, 'Valid phone required').optional(),
  customerAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  address: z.string().optional(),
  institution: z.string().optional(),
  notes: z.string().max(1000).optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID required'),
      quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').default(1),
      price: z.coerce.number().optional(),
      title: z.string().optional(),
    })
  ).min(1, 'At least one item is required in order'),
}).transform((data) => ({
  ...data,
  email: data.email || data.customerEmail || 'inquiry@robotree.org',
  phone: data.phone || data.customerPhone || '',
  address: data.address || data.shippingAddress || data.customerAddress || '',
}));
