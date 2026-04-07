import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { parseDurationToMs } from '../../../common/utils/duration.util';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthRepository } from '../repositories/auth.repository';
import { AuthRequestMetadata } from '../types/auth-request-metadata.type';
import {
  AuthResult,
  AuthenticatedUserProfile,
  AuthTokenBundle,
} from '../types/auth-result.type';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../types/jwt-payload.type';

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly accessExpiresIn: string;
  private readonly accessExpiresInSeconds: number;
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;
  private readonly refreshExpiresInSeconds: number;
  private readonly bcryptSaltRounds: number;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.accessSecret = configService.getOrThrow<string>('auth.accessSecret');
    this.accessExpiresIn = configService.getOrThrow<string>('auth.accessExpiresIn');
    this.accessExpiresInSeconds = Math.floor(
      parseDurationToMs(this.accessExpiresIn) / 1000,
    );
    this.refreshSecret = configService.getOrThrow<string>('auth.refreshSecret');
    this.refreshExpiresIn = configService.getOrThrow<string>(
      'auth.refreshExpiresIn',
    );
    this.refreshExpiresInSeconds = Math.floor(
      parseDurationToMs(this.refreshExpiresIn) / 1000,
    );
    this.bcryptSaltRounds = configService.getOrThrow<number>(
      'auth.bcryptSaltRounds',
    );
  }

  async register(
    dto: RegisterDto,
    metadata: AuthRequestMetadata,
  ): Promise<AuthResult> {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.authRepository.findUserByEmail(email);

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const userCount = await this.authRepository.countUsers();
    const assignedRole = userCount === 0 ? UserRole.ADMIN : UserRole.VIEWER;
    const passwordHash = await bcrypt.hash(dto.password, this.bcryptSaltRounds);

    const user = await this.authRepository.createUser({
      email,
      fullName: dto.fullName.trim(),
      passwordHash,
      role: assignedRole,
    });

    const tokens = await this.issueTokenPair(user, metadata);

    return {
      user: this.toAuthenticatedUserProfile(user),
      tokens,
    };
  }

  async login(dto: LoginDto, metadata: AuthRequestMetadata): Promise<AuthResult> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('This user account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const updatedUser = await this.authRepository.updateLastLogin(user.id, new Date());
    const tokens = await this.issueTokenPair(updatedUser, metadata);

    return {
      user: this.toAuthenticatedUserProfile(updatedUser),
      tokens,
    };
  }

  async refresh(
    dto: RefreshTokenDto,
    metadata: AuthRequestMetadata,
  ): Promise<AuthResult> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const existingToken = await this.authRepository.findRefreshTokenWithUserById(
      payload.tokenId,
    );

    if (!existingToken) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    if (existingToken.revokedAt) {
      throw new UnauthorizedException('Refresh token has already been revoked');
    }

    if (existingToken.expiresAt.getTime() <= Date.now()) {
      await this.authRepository.revokeRefreshToken(existingToken.id, new Date());
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (!existingToken.user.isActive) {
      throw new ForbiddenException('This user account is inactive');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      dto.refreshToken,
      existingToken.tokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const tokens = await this.rotateTokenPair(
      existingToken.id,
      existingToken.user,
      metadata,
    );

    return {
      user: this.toAuthenticatedUserProfile(existingToken.user),
      tokens,
    };
  }

  private async issueTokenPair(
    user: User,
    metadata: AuthRequestMetadata,
  ): Promise<AuthTokenBundle> {
    const accessTokenPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      partnerId: user.partnerId,
      type: 'access',
    };

    const refreshTokenId = randomUUID();
    const refreshTokenPayload: RefreshTokenPayload = {
      ...accessTokenPayload,
      type: 'refresh',
      tokenId: refreshTokenId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.accessSecret,
        expiresIn: this.accessExpiresInSeconds,
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresInSeconds,
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      this.bcryptSaltRounds,
    );

    await this.authRepository.createRefreshToken({
      id: refreshTokenId,
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + parseDurationToMs(this.refreshExpiresIn)),
      userAgent: metadata.userAgent ?? null,
      ipAddress: metadata.ipAddress ?? null,
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.accessExpiresIn,
      refreshTokenExpiresIn: this.refreshExpiresIn,
    };
  }

  private async rotateTokenPair(
    currentTokenId: string,
    user: User,
    metadata: AuthRequestMetadata,
  ): Promise<AuthTokenBundle> {
    const accessTokenPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      partnerId: user.partnerId,
      type: 'access',
    };

    const newRefreshTokenId = randomUUID();
    const refreshTokenPayload: RefreshTokenPayload = {
      ...accessTokenPayload,
      type: 'refresh',
      tokenId: newRefreshTokenId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.accessSecret,
        expiresIn: this.accessExpiresInSeconds,
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresInSeconds,
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      this.bcryptSaltRounds,
    );

    // Rotation is intentionally atomic so a refresh token cannot stay active
    // after its replacement has been issued.
    await this.authRepository.rotateRefreshToken({
      currentTokenId,
      revokedAt: new Date(),
      newRefreshToken: {
        id: newRefreshTokenId,
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + parseDurationToMs(this.refreshExpiresIn)),
        userAgent: metadata.userAgent ?? null,
        ipAddress: metadata.ipAddress ?? null,
      },
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.accessExpiresIn,
      refreshTokenExpiresIn: this.refreshExpiresIn,
    };
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.refreshSecret,
        },
      );

      if (payload.type !== 'refresh' || !payload.tokenId) {
        throw new UnauthorizedException('Refresh token payload is invalid');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
  }

  private toAuthenticatedUserProfile(user: User): AuthenticatedUserProfile {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      partnerId: user.partnerId,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
