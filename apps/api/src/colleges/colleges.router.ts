import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/authenticate';
import { collegesController } from './colleges.controller';
import { Action, PermissionScope } from '@accred-iq/database';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  requirePermission('college', Action.READ, PermissionScope.COLLEGE),
  (req, res, next) => collegesController.list(req, res, next)
);

router.get(
  '/:id',
  requirePermission('college', Action.READ, PermissionScope.COLLEGE),
  (req, res, next) => collegesController.get(req, res, next)
);

router.post(
  '/',
  requirePermission('college', Action.WRITE, PermissionScope.UNIVERSITY),
  (req, res, next) => collegesController.create(req, res, next)
);

router.put(
  '/:id',
  requirePermission('college', Action.EDIT, PermissionScope.COLLEGE),
  (req, res, next) => collegesController.update(req, res, next)
);

router.delete(
  '/:id',
  requirePermission('college', Action.EDIT, PermissionScope.UNIVERSITY),
  (req, res, next) => collegesController.remove(req, res, next)
);

export default router;
