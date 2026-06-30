import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/authenticate';
import { programsController } from './programs.controller';
import { Action, PermissionScope } from '@accred-iq/database';

const router = Router();
router.use(authenticate);

router.get('/', requirePermission('program', Action.READ, PermissionScope.DEPARTMENT), (req, res, next) => programsController.list(req, res, next));
router.get('/:id', requirePermission('program', Action.READ, PermissionScope.DEPARTMENT), (req, res, next) => programsController.get(req, res, next));
router.post('/', requirePermission('program', Action.WRITE, PermissionScope.DEPARTMENT), (req, res, next) => programsController.create(req, res, next));
router.put('/:id', requirePermission('program', Action.EDIT, PermissionScope.DEPARTMENT), (req, res, next) => programsController.update(req, res, next));

export default router;
