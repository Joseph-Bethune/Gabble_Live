import jwt from 'jsonwebtoken';

//#region jwt tokens

const accessTokenLifeSpan = '1d';
const refreshTokenLifeSpan = '1d';

//#region token encoding

export const generateTokenPayload = (user) => {
    return {
        "userInfo": {
            "username": user.username,
            "roles": Object.values(user.roles),
        },
        "originTimestamp": new Date()
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

//region extracts data encoded in jwt token from an api request
export const decodeAccessToken = (req) => {
    
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return { success: false, code: 401, message: "no headers for access token" };

    const token = authHeader.split(' ')[1];
    if (!token) return { success: false, code: 401, message: "no access token in headers" };

    let output = {
        accessToken: token
    };
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) {
                output.success = false;
                output.message = 'error decoding access token: ' + err;
                output.code = 403;
            } else {
                output.success = true;
                output.username = decoded.userInfo.username;
                output.roles = decoded.userInfo.roles;
                output.message = `access token for ${decoded.userInfo.username} is valid`;
                output.code = 200;
            }
        }
    );
    return output;
}

// extracts data encoded in jwt token from an api request
export const decodeRefreshToken = (req) => {

    const token = req.cookies?.jwtRefreshToken;
    if (!token) return { success: false, code: 401, message: "no refresh token" };

    let output = {
        refreshToken: token
    };

    jwt.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if (err) {
                output.success = false;
                output.message = 'error decoding refresh token: ' + err;
                output.code = 403;
            } else {
                output.success = true;
                output.username = decoded.userInfo.username;
                output.roles = decoded.userInfo.roles;
                output.message = `refresh token for ${decoded.userInfo.username} is valid`;
                output.code = 403;
            }
        }
    );

    return output;
}

//#endregion

//#endregion

export const verifyJWTAccessToken = (req, res, next) => {
    
    const decodeStatus = decodeAccessToken(req);

    if(decodeStatus.success){
        req.user = decodeStatus.username;
        req.roles = decodeStatus.roles;
        next();
        return;
    } else {
        return res.status(decodeStatus.code).json({success: false, message: decodeStatus.message});
    }
}

export const verifyJWTRefreshToken = (req, res, next) => {
    
    const decodeStatus = decodeRefreshToken(req);

    if(decodeStatus.success){
        req.user = decodeStatus.username;
        req.roles = decodeStatus.roles;
        next();
        return;
    } else {
        return res.status(decodeStatus.code).json({success: false, message: decodeStatus.message});
    }
}