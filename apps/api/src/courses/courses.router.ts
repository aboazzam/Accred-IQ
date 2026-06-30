import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/authenticate';
import { coursesController } from './courses.controller';
import { Action, PermissionScope } from '@accred-iq/database';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('course', Action.READ, PermissionScope.DEPARTMENT), (req, res, next) => coursesController.list(req, res, next));
router.get('/:id', requirePermission('course', Action.READ, PermissionScope.OWN), (req, res, next) => coursesController.get(req, res, next));
router.post('/', requirePermission('course', Action.WRITE, PermissionScope.DEPARTMENT), (req, res, next) => coursesController.create(req, res, next));
router.put('/:id', requirePermission('course', Action.EDIT, PermissionScope.OWN), (req, res, next) => coursesController.update(req, res, next));

export default router;
