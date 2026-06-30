import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/authenticate';
import { outcomesController } from './outcomes.controller';
import { Action, PermissionScope } from '@accred-iq/database';

const router = Router();
router.use(authenticate);

// ---- PLOs: /api/programs/:programId/plos ----
router.get(
  '/programs/:programId/plos',
  requirePermission('plo', Action.READ, PermissionScope.DEPARTMENT),
  (req, res, next) => outcomesController.listPlos(req, res, next)
);

router.post(
  '/programs/:programId/plos',
  requirePermission('plo', Action.WRITE, PermissionScope.DEPARTMENT),
  (req, res, next) => outcomesController.createPlo(req, res, next)
);

router.put(
  '/plos/:id',
  requirePermission('plo', Action.EDIT, PermissionScope.DEPARTMENT),
  (req, res, next) => outcomesController.updatePlo(req, res, next)
);

router.delete(
  '/plos/:id',
  requirePermission('plo', Action.EDIT, PermissionScope.DEPARTMENT),
  (req, res, next) => outcomesController.deletePlo(req, res, next)
);

// ---- CLOs: /api/outcomes/courses/:courseId/clos ----
router.get(
  '/courses/:courseId/clos',
  requirePermission('clo', Action.READ, PermissionScope.OWN),
  (req, res, next) => outcomesController.listClos(req, res, next)
);

router.post(
  '/courses/:courseId/clos',
  requirePermission('clo', Action.WRITE, PermissionScope.OWN),
  (req, res, next) => outcomesController.createClo(req, res, next)
);

router.put(
  '/clos/:id',
  requirePermission('clo', Action.EDIT, PermissionScope.OWN),
  (req, res, next) => outcomesController.updateClo(req, res, next)
);

router.delete(
  '/clos/:id',
  requirePermission('clo', Action.EDIT, PermissionScope.DEPARTMENT),
  (req, res, next) => outcomesController.deleteClo(req, res, next)
);

// ---- Mapping Matrix: /api/outcomes/mapping ----
router.get(
  '/mapping/:programId',
  requirePermission('mapping', Action.READ, PermissionScope.DEPARTMENT),
  (req, res, next) => outcomesController.getMatrix(req, res, next)
);

router.put(
  '/mapping/:ploId/:cloId',
  requirePermission('mapping', Action.EDIT, PermissionScope.DEPARTMENT),
  (req, res, next) => outcomesController.setMapping(req, res, next)
);

router.delete(
  '/mapping/:ploId/:cloId',
  requirePermission('mapping', Action.EDIT, PermissionScope.DEPARTMENT),
  (req, res, next) => outcomesController.removeMapping(req, res, next)
);

export default router;
