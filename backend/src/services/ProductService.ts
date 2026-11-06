import crypto from 'node:crypto';
import { repositories } from '../repositories/index.js';
import { Product, StoreOrder } from '../models/index.js';
import { NotFoundError, ValidationError } from '../errors/AppError.js';
import { AuditService } from './AuditService.js';
import { storageService } from './StorageService.js';

export class ProductService {
  public static async listProducts(options?: {
    category?: string;
    search?: string;
    inStockOnly?: boolean;
  }): Promise<Product[]> {
    return repositories.products.list(options);
  }

  public static async getProductById(id: string): Promise<Product> {
    const product = await repositories.products.findById(id);
    if (!product) {
      throw new NotFoundError(`Product not found: ${id}`);
    }
    return product;
  }

  public static async createProduct(dto: any, actor = 'System Administrator'): Promise<Product> {
    const uniqueNum = Math.floor(100 + Math.random() * 900);
    const id = dto.id || `PROD-RBT-${Date.now().toString().slice(-4)}${uniqueNum}`;
    const sku = dto.sku || `RBT-${dto.category?.slice(0, 3).toUpperCase() || 'ITM'}-${Date.now().toString().slice(-4)}`;

    let image = dto.image || 'assets/store/kit_4wd_robot.jpg';

    if (dto.fileBase64) {
      try {
        const matches = dto.fileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const rawBase64 = matches ? matches[2] : dto.fileBase64;
        const buffer = Buffer.from(rawBase64, 'base64');
        const origName = dto.fileOriginalName || `${id}.jpg`;
        image = await storageService.saveFile(buffer, origName, 'store');
      } catch (err) {
        console.error('Failed to save uploaded product image:', err);
      }
    }

    const newProduct: Product = {
      id,
      title: dto.title.trim(),
      category: dto.category,
      price: Number(dto.price),
      originalPrice: dto.originalPrice ? Number(dto.originalPrice) : undefined,
      inStock: dto.inStock !== false,
      stockQuantity: Number(dto.stockQuantity ?? 10),
      sku,
      image,
      description: dto.description || '',
      features: Array.isArray(dto.features) ? dto.features : [],
      featured: Boolean(dto.featured),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await repositories.products.create(newProduct);

    await AuditService.logAction(actor, 'PRODUCT_CREATED', 'store', `Added product ${created.title} (${created.id})`, {
      resourceId: created.id,
    });

    return created;
  }

  public static async updateProduct(id: string, dto: any, actor = 'System Administrator'): Promise<Product> {
    const existing = await repositories.products.findById(id);
    if (!existing) {
      throw new NotFoundError(`Product not found: ${id}`);
    }

    let image = dto.image !== undefined ? dto.image : existing.image;
    if (dto.removeImage) {
      image = '';
    }

    if (dto.fileBase64) {
      try {
        const matches = dto.fileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const rawBase64 = matches ? matches[2] : dto.fileBase64;
        const buffer = Buffer.from(rawBase64, 'base64');
        const origName = dto.fileOriginalName || `${id}.jpg`;
        image = await storageService.saveFile(buffer, origName, 'store');
      } catch (err) {
        console.error('Failed to save uploaded product image on update:', err);
      }
    }

    const updates: Partial<Product> = {
      ...dto,
      image,
      price: dto.price !== undefined ? Number(dto.price) : existing.price,
      originalPrice: dto.originalPrice !== undefined ? Number(dto.originalPrice) : existing.originalPrice,
      stockQuantity: dto.stockQuantity !== undefined ? Number(dto.stockQuantity) : existing.stockQuantity,
      updatedAt: new Date().toISOString(),
    };

    const updated = await repositories.products.update(id, updates);
    if (!updated) {
      throw new NotFoundError(`Product update failed: ${id}`);
    }

    await AuditService.logAction(actor, 'PRODUCT_UPDATED', 'store', `Updated product ${updated.title} (${id})`, {
      resourceId: id,
    });

    return updated;
  }

  public static async deleteProduct(id: string, actor = 'System Administrator'): Promise<boolean> {
    const existing = await repositories.products.findById(id);
    if (!existing) {
      throw new NotFoundError(`Product not found: ${id}`);
    }

    const success = await repositories.products.delete(id);

    await AuditService.logAction(actor, 'PRODUCT_DELETED', 'store', `Deleted product ${existing.title} (${id})`, {
      resourceId: id,
    });

    return success;
  }

  public static async toggleStock(id: string, inStock: boolean, actor = 'System Administrator'): Promise<Product> {
    const existing = await repositories.products.findById(id);
    if (!existing) {
      throw new NotFoundError(`Product not found: ${id}`);
    }

    const updated = await repositories.products.update(id, {
      inStock,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) {
      throw new NotFoundError(`Product update failed: ${id}`);
    }

    await AuditService.logAction(
      actor,
      'PRODUCT_STOCK_TOGGLED',
      'store',
      `Toggled stock for ${updated.title} to ${inStock ? 'IN_STOCK' : 'OUT_OF_STOCK'}`,
      { resourceId: id }
    );

    return updated;
  }

  public static async createOrder(orderDto: any): Promise<StoreOrder> {
    const orderId = `ORD-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    let totalAmount = 0;
    const items = await Promise.all(
      orderDto.items.map(async (item: any) => {
        let price = Number(item.price);
        let title = item.title;
        let image = item.image || '';
        const prod = await repositories.products.findById(String(item.productId));
        if (prod) {
          if (!price || !title || title === 'Hardware Product') {
            price = Number(prod.price);
            title = prod.title;
          }
          if (!image) {
            image = prod.image || 'assets/store/kit_4wd_robot.jpg';
          }
        }
        if (!image) image = 'assets/store/kit_4wd_robot.jpg';
        const qty = Number(item.quantity || 1);
        const subtotal = (price || 0) * qty;
        totalAmount += subtotal;
        return {
          productId: String(item.productId),
          title: String(title || 'Hardware Product'),
          image,
          price: price || 0,
          quantity: qty,
          subtotal,
        };
      })
    );

    const newOrder: StoreOrder = {
      id: orderId,
      customerName: orderDto.customerName.trim(),
      email: (orderDto.email || orderDto.customerEmail || 'inquiry@robotree.org').trim().toLowerCase(),
      phone: (orderDto.phone || orderDto.customerPhone || '').trim(),
      address: (orderDto.address || orderDto.shippingAddress || orderDto.customerAddress || '').trim(),
      notes: orderDto.notes || '',
      items,
      totalAmount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const savedOrder = await repositories.products.createOrder(newOrder);

    // Also persist as lead inquiry with product name and photo so it surfaces in admin dashboard
    try {
      const primaryItem = items[0] || {};
      await repositories.inquiries.create({
        id: `INQ-${orderId}`,
        name: newOrder.customerName,
        email: newOrder.email,
        phone: newOrder.phone,
        subject: `Hardware Order ${orderId}`,
        interest: 'Hardware Store Procurement',
        message: `Order ${orderId}: ${items.map(i => `${i.title} (x${i.quantity})`).join(', ')}. Total: Rs. ${totalAmount}`,
        status: 'NEW',
        orderId,
        productId: primaryItem.productId,
        productTitle: primaryItem.title,
        productImage: primaryItem.image || 'assets/store/kit_4wd_robot.jpg',
        items,
        totalAmount,
      });
    } catch {}

    return savedOrder;
  }
}
