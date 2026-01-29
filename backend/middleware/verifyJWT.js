import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';

const accessTokenLifeSpan = '1h';
const refreshTokenLifeSpan = '1d';

//#region token encoding

export const generateTokenPayload = (user) => {
    return {
        userInfo: {
            id: user._id,
            email: user.email,
            roles: Object.values(user.roles),
        },
        originTimestamp: new Date()
    }
}

export const generateAccessToken = (user) => {
    return jwt.sign(
        generateTokenPayload(user),
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: accessTokenLifeSpan }
    );
}

export const generateRefreshToken = (user) => {
    return jwt.sign(
        generateTokenPayload(user),
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: refreshTokenLifeSpan }
    );
}

//#endregion

//#region token decoding

export const decodeAccessToken = async (req) => {

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return { success: false, code: 401, message: "no headers for access token" };

    const token = authHeader.split(' ')[1];
    if (!token) return { success: false, code: 401, message: "no access token in headers" };

    let output = {
        accessToken: token
    };

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (decoded) {
            const userFromToken = await UserModel.findById(decoded.userInfo.id).select('-password').exec();

            output.userFromToken = userFromToken;
            output.success = true;
            output.userInfo = decoded.userInfo;
            output.message = `Access token for ${userFromToken.displayName} is valid.`;
            output.code = 200;

        } else {
            output.success = false;
            output.message = 'Unknown error decoding token.';
            output.code = 403;
        }
    } catch (err) {
        output.success = false;
        output.message = 'error decoding access token: ' + err;
        output.code = 403;
    }
    return output;
}

export const decodeRefreshToken = async (req) => {

    const token = req.cookies?.jwtRefreshToken;
    if (!token) return { success: false, code: 401, message: "no refresh token" };

    let output = {
        refreshToken: token
    };

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    try {
        if (decoded) {
            const userFromToken = await UserModel.findById(decoded.userInfo.id).select('-password').exec();

            output.userFromToken = userFromToken;
            output.success = true;
            output.userInfo = decoded.userInfo;
            output.message = `Refresh token for ${userFromToken.displayName} is valid.`;
            output.code = 200;

        } else {
            output.success = false;
            output.message = 'Unknown error decoding token.';
            output.code = 403;
        }
    } catch (err) {
        output.success = false;
        output.message = 'Error decoding token: ' + err;
        output.code = 403;
    }
    return output;
}

//#endregion

//#region cookie options

export const getCookieOptions = () => {

    const output = {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
    };

    if (process.env.NODE_ENV == "production") {
        output.sameSite = 'Strict';
        output.secure = true;
    }

    return output;
}

//#endregion

//#region middleware

export const verifyJWTAccessToken = async (req, res, next) => {

    const decodeStatus = await decodeAccessToken(req);

    if (decodeStatus.success) {
        req.userInfo = decodeStatus.userInfo;
        req.userFromToken = decodeStatus.userFromToken;
        req.accessToken = decodeStatus.accessToken;
        next();
        return;
    } else {
        return res.status(decodeStatus.code).json({ success: false, message: decodeStatus.message });
    }
}

export const verifyJWTRefreshToken = async (req, res, next) => {

    const decodeStatus = await decodeRefreshToken(req);

    if (decodeStatus.success) {
        req.userInfo = decodeStatus.userInfo;
        req.userFromToken = decodeStatus.userFromToken;
        req.refreshToken = decodeStatus.refreshToken;
        next();
        return;
    } else {
        return res.status(decodeStatus.code).json({ success: false, message: decodeStatus.message });
    }
}

//#endregion