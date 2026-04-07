import { UserRole } from '@prisma/client';

export type AuthenticatedUserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  partnerId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthTokenBundle = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
};

export type AuthResult = {
  user: AuthenticatedUserProfile;
  tokens: AuthTokenBundle;
};
