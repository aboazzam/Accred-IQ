import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/authenticate';
import { departmentsController } from './departments.controller';
import { Action, PermissionScope } from '@accred-iq/database';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('department', Action.READ, PermissionScope.DEPARTMENT), (req, res, next) => departmentsController.list(req, res, next));
router.get('/:id', requirePermission('department', Action.READ, PermissionScope.DEPARTMENT), (req, res, next) => departmentsController.get(req, res, next));
router.post('/', requirePermission('department', Action.WRITE, PermissionScope.COLLEGE), (req, res, next) => departmentsController.create(req, res, next));
router.put('/:id', requirePermission('department', Action.EDIT, PermissionScope.DEPARTMENT), (req, res, next) => departmentsController.update(req, res, next));
router.delete('/:id', requirePermission('department', Action.EDIT, PermissionScope.COLLEGE), (req, res, next) => departmentsController.remove(req, res, next));

export default router;
