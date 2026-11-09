import { Router } from 'express';
import { ProductController } from '../../controllers/ProductController.js';
import { validateRequest } from '../../validators/validateRequest.js';
import {
  createProductSchema,
  updateProductSchema,
  createStoreOrderSchema,
} from '../../validators/product.validator.js';
import { requireAdmin } from '../../middleware/authenticate.js';
import { formRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Public Product Catalog Endpoints
router.get('/products', ProductController.list);
router.get('/products/:id', ProductController.getById);
router.get('/', ProductController.list);
router.get('/:id', ProductController.getById);

// Public Order / Procurement Inquiries Endpoint
router.post('/orders', formRateLimiter, validateRequest(createStoreOrderSchema), ProductController.createOrder);

// Admin-Protected Product Management Endpoints
router.post(
  '/products',
  requireAdmin,
  validateRequest(createProductSchema),
  ProductController.create
);

router.put(
  '/products/:id',
  requireAdmin,
  validateRequest(updateProductSchema),
  ProductController.update
);

router.delete(
  '/products/:id',
  requireAdmin,
  ProductController.delete
);

router.patch(
  '/products/:id/stock',
  requireAdmin,
  ProductController.toggleStock
);

export default router;
