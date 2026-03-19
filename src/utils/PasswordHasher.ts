import * as crypto from 'crypto';

export class PasswordHasher {
    private static readonly SaltSize = 16; // 128-bit
    private static readonly KeySize = 32;  // 256-bit
    private static readonly Iterations = 100000;

    public static hash(password: string): string {
        const salt = crypto.randomBytes(this.SaltSize);
        const key = crypto.pbkdf2Sync(password, salt, this.Iterations, this.KeySize, 'sha256');

        // Ghép salt + hash thành chuỗi base64: "salt:hash"
        return `${salt.toString('base64')}:${key.toString('base64')}`;
    }

    public static verify(password: string, storedHash: string): boolean {
        const parts = storedHash.split(':');
        if (parts.length !== 2) return false;

        const salt = Buffer.from(parts[0], 'base64');
        const stored = Buffer.from(parts[1], 'base64');

        const computed = crypto.pbkdf2Sync(password, salt, this.Iterations, this.KeySize, 'sha256');

        return crypto.timingSafeEqual(computed, stored);
    }
}