import { signAccessToken, signRefreshToken } from '../config/jwt.js';

/**
 * Generates access + refresh token pair for a given user/role
 * @param {Object} payload - { id, role, email }
 * @returns {{ accessToken, refreshToken }}
 */
export const generateTokens = (payload) => {
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    return { accessToken, refreshToken };
};
