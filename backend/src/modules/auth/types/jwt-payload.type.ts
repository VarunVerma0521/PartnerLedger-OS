import { UserRole } from '@prisma/client';

type BaseJwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  partnerId: string | null;
};

export type AccessTokenPayload = BaseJwtPayload & {
  type: 'access';
};

export type RefreshTokenPayload = BaseJwtPayload & {
  type: 'refresh';
  tokenId: string;
};

export type AuthenticatedUser = BaseJwtPayload;
