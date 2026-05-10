import rateLimit from 'express-rate-limit';

export const inventoryRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: {
        success: false,
        message: "Thao tác quá nhanh! Vui lòng đợi một chút trước khi thử lại."
    },
    standardHeaders: true,
    legacyHeaders: false,
});