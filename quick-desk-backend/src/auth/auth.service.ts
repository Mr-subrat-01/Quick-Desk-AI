import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { LoginDto } from './dtos/login.dto';

function parseDevicePlatform(ua?: string | null): string {
  if (!ua) return 'Unknown Device';
  const cleanUA = ua.toLowerCase();
  const browser = ['edg/', 'firefox/', 'chrome/', 'safari/'].find(b => cleanUA.includes(b)) || 'browser/';
  const os = ['android', 'iphone', 'ipad', 'win', 'mac', 'linux'].find(o => cleanUA.includes(o)) || 'device';
  const names: Record<string, string> = {
    'edg/': 'Edge', 'firefox/': 'Firefox', 'chrome/': 'Chrome', 'safari/': 'Safari', 'browser/': 'Browser',
    'win': 'Windows', 'mac': 'macOS', 'linux': 'Linux', 'android': 'Android', 'iphone': 'iOS', 'ipad': 'iOS', 'device': 'Device'
  };
  return `${names[browser]} on ${names[os]}`;
}


@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async signIn(loginDto: LoginDto, userAgent?: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { id: user.id, sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    const refreshTokenString = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        userAgent: parseDevicePlatform(userAgent),
        ipAddress: ipAddress || '127.0.0.1',
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenRecord.token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshTokenString: string, userAgent?: string, ipAddress?: string) {
    if (!refreshTokenString) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked || new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    const newRefreshTokenString = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updatedRecord = await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        token: newRefreshTokenString,
        userAgent: parseDevicePlatform(userAgent || tokenRecord.userAgent),
        ipAddress: ipAddress || tokenRecord.ipAddress,
        expiresAt,
      },
    });

    const user = tokenRecord.user;
    const payload = { id: user.id, sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    return {
      accessToken,
      refreshToken: updatedRecord.token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getActiveSessions(userId: string, currentToken?: string) {
    const sessions = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        token: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      isCurrent: currentToken ? s.token === currentToken : false,
    }));
  }

  async revokeSession(userId: string, sessionId: string, currentToken?: string) {
    const session = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.refreshToken.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    const isCurrentSession = currentToken ? session.token === currentToken : false;

    return { isCurrentSession };
  }

  async logoutAllSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async logout(refreshTokenString?: string) {
    if (refreshTokenString) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshTokenString },
        data: { isRevoked: true },
      });
    }
  }
}
