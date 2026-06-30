import { Action, PermissionScope } from '@accred-iq/database';

export interface PermissionToken {
  resource: string;
  action: Action;
  scope: PermissionScope;
  field: string | null;
}

export interface JwtPayload {
  sub: string;          // userId
  email: string;
  name: string;
  roleId: string;
  roleCode: string;
  roleNameAr: string;
  permissions: PermissionToken[];
  type: 'access' | 'refresh';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: {
      id: string;
      code: string;
      name: string;
      nameAr: string;
    };
  };
}
