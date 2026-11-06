import { Router, Request, Response, NextFunction } from 'express';
import { requireEmployee } from '../../middleware/requireEmployee.js';
import { repositories } from '../../repositories/index.js';
import { AuditService } from '../../services/AuditService.js';
import { getParam } from '../../utils/params.js';

const router = Router();

/**
 * GET /api/employee/inquiries
 * List inquiries with pagination and optional filters.
 * Query params: page (1-based), limit, status, dateFrom, dateTo
 */
router.get('/inquiries', requireEmployee, async (req: Request, res: Response, next: NextFunction) => {
  try {
    let list = await repositories.inquiries.list();

    // Filter by status
    const { status, dateFrom, dateTo } = req.query as Record<string, string>;
    if (status) {
      list = list.filter((i: any) => i.status && i.status.toUpperCase() === status.toUpperCase());
    }
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      list = list.filter((i: any) => i.createdAt && new Date(i.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime();
      list = list.filter((i: any) => i.createdAt && new Date(i.createdAt).getTime() <= to);
    }

    // Pagination
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const total = list.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = list.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      count: paginated.length,
      total,
      page,
      totalPages,
      inquiries: paginated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/employee/inquiries/:id
 * Update a specific inquiry. Logs audit entry.
 */
router.put('/inquiries/:id', requireEmployee, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getParam(req, 'id');
    const updated = await repositories.inquiries.update(id, req.body);

    await AuditService.logAction(
      req.user!.email,
      'EMPLOYEE_INQUIRY_UPDATED',
      'inquiries',
      `Employee ${req.user!.name} (${req.user!.id}) updated inquiry ${id}`,
      { resourceId: id }
    );

    res.json({ success: true, inquiry: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/employee/me
 * Returns the logged-in employee profile.
 */
router.get('/me', requireEmployee, (req: Request, res: Response) => {
  res.json({ success: true, user: req.user });
});

export default router;
