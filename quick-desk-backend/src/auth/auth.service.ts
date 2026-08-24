import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { LoginDto } from './dtos/login.dto';
import type { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  async signIn(loginDto: LoginDto, res: Response) {
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
    const accessToken = await this.jwtService.signAsync(payload);

    const { refreshToken, refreshTokenExpireAt } = this.generateRefreshToken();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        refreshTokenExpireAt,
      },
    });
    this.setRefreshTokenCookie(res, refreshToken);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refreshTokenAsync(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const userRecord = await this.prisma.user.findFirst({
      where: { refreshToken },
    });
    if (!userRecord || !userRecord.refreshToken || !userRecord.refreshTokenExpireAt || new Date() > userRecord.refreshTokenExpireAt) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
    const payload = { id: userRecord.id, sub: userRecord.id, email: userRecord.email, role: userRecord.role };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        firstName: userRecord.firstName,
        lastName: userRecord.lastName,
        role: userRecord.role,
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

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null, refreshTokenExpireAt: null },
    });
  }

  private generateRefreshToken() {
    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenDays = Number(this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN_DAYS'));
    const refreshTokenExpireAt = new Date();
    refreshTokenExpireAt.setDate(refreshTokenExpireAt.getDate() + refreshTokenDays);
    return { refreshToken, refreshTokenExpireAt };
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    const refreshTokenDays = Number(this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN_DAYS'));
    const refreshDuration = refreshTokenDays * 24 * 60 * 60 * 1000;
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshDuration,
    });
  }
}
