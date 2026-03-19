import * as jwt from 'jsonwebtoken';
import { TimeHelper } from './TimeHelper';

export class JwtHelper {
    public static generateToken(accountId: string, username: string, secretKey: string, issuer: string, audience: string): string {
        if (!secretKey || secretKey.length < 32) {
            throw new Error("JWT secret key must be at least 32 characters.");
        }

        // Thời gian TOKEN hết hạn
        const expires = TimeHelper.getVietnamTime();
        expires.setDate(expires.getDate() + 1);
        const expSeconds = Math.floor(expires.getTime() / 1000);

        const payload = {
            sub: username,
            accountId: accountId,
            exp: expSeconds
        };

        return jwt.sign(payload, secretKey, {
            algorithm: 'HS256',
            issuer: issuer,
            audience: audience
        });
    }
}