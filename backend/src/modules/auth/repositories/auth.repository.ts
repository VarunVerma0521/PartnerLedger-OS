import { Injectable } from '@nestjs/common';
import { Prisma, RefreshToken, User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type RefreshTokenWithUserRecord = Prisma.RefreshTokenGetPayload<{
  include: { user: true };
}>;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  countUsers(): Promise<number> {
    return this.prisma.user.count();
  }

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  createUser(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  updateLastLogin(userId: string, lastLoginAt: Date): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt },
    });
  }

  createRefreshToken(
    data: Prisma.RefreshTokenUncheckedCreateInput,
  ): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  findRefreshTokenWithUserById(
    refreshTokenId: string,
  ): Promise<RefreshTokenWithUserRecord | null> {
    return this.prisma.refreshToken.findUnique({
      where: { id: refreshTokenId },
      include: { user: true },
    });
  }

  revokeRefreshToken(refreshTokenId: string, revokedAt: Date): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { id: refreshTokenId },
      data: { revokedAt },
    });
  }

  async rotateRefreshToken(params: {
    currentTokenId: string;
    revokedAt: Date;
    newRefreshToken: Prisma.RefreshTokenUncheckedCreateInput;
  }): Promise<void> {
    const { currentTokenId, revokedAt, newRefreshToken } = params;

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: currentTokenId },
        data: { revokedAt },
      }),
      this.prisma.refreshToken.create({
        data: newRefreshToken,
      }),
    ]);
  }
}
