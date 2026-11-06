import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/ProductService.js';
import { getParam } from '../utils/params.js';

export class ProductController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const inStockOnly = req.query.inStock === 'true';

      const products = await ProductService.listProducts({ category, search, inStockOnly });
      res.json({
        success: true,
        count: products.length,
        products,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      const product = await ProductService.getProductById(id);
      res.json({
        success: true,
        product,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const actor = req.user?.email || 'System Administrator';
      const product = await ProductService.createProduct(req.body, actor);
      res.status(201).json({
        success: true,
        message: 'Product created successfully.',
        product,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      const actor = req.user?.email || 'System Administrator';
      const product = await ProductService.updateProduct(id, req.body, actor);
      res.json({
        success: true,
        message: 'Product updated successfully.',
        product,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      const actor = req.user?.email || 'System Administrator';
      await ProductService.deleteProduct(id, actor);
      res.json({
        success: true,
        message: 'Product deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async toggleStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParam(req, 'id');
      const inStock = Boolean(req.body.inStock);
      const actor = req.user?.email || 'System Administrator';
      const product = await ProductService.toggleStock(id, inStock, actor);
      res.json({
        success: true,
        message: `Product stock status updated to ${inStock ? 'In Stock' : 'Out of Stock'}.`,
        product,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await ProductService.createOrder(req.body);
      res.status(201).json({
        success: true,
        message: 'Hardware procurement quote / order placed successfully.',
        order,
      });
    } catch (err) {
      next(err);
    }
  }
}
