import jwt from 'jsonwebtoken';

//#region jwt tokens

const accessTokenLifeSpan = '1d';
const refreshTokenLifeSpan = '1d';

//#region token creation

export const generateAccessTokenPayload = (user) => {
    return {
        "userInfo": {
            "username": user.username,
            "roles": Object.values(user.roles),
        },
        "originTimestamp": new Date()
    }
}

export const generateRefreshTokenPayload = (user) => {
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
        generateAccessTokenPayload(user),
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: accessTokenLifeSpan }
    );
}

export const generateRefreshToken = (user) => {
    return jwt.sign(
        generateRefreshTokenPayload(user),
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: refreshTokenLifeSpan }
    );
}

//#endregion

// extracts data encoded in jwt token from an api request
export const decodeAccessToken = (req) => {
    
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return { success: false, message: "no headers for access token" };

    const token = authHeader.split(' ')[1];
    if (!token) return { success: false, message: "no access token in headers" };

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
            } else {
                output.success = true;
                output.username = decoded.userInfo.username;
                output.roles = decoded.userInfo.roles;
                output.message = `access token for ${decoded.userInfo.username} is valid`;
            }
        }
    );
    return output;
}

// extracts data encoded in jwt token from an api request
export const decodeRefreshToken = (req) => {

    const token = req.cookies?.jwtRefreshToken;
    if (!token) return { success: false, message: "no refresh token" };

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
            } else {
                output.success = true;
                output.username = decoded.userInfo.username;
                output.roles = decoded.userInfo.roles;
                output.message = `refresh token for ${decoded.userInfo.username} is valid`;
            }
        }
    );

    return output;
}

//#endregion

export const verifyJWTAccessToken = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if(!authHeader?.startsWith('Bearer ')) return res.status(401).json({success:false, message: "no headers for access token"});
    
    const token = authHeader.split(' ')[1];
    if(!token) return res.status(401).json({success:false, message: "no access token in headers"});        

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if(err) {
                res.status(403).json({success:false, message:"invalid access token"}); //invalid token
            } else {            
                req.user = decoded.userInfo.username;
                req.roles = decoded.userInfo.roles;                
            }
            next();
        }
    );
}

export const verifyJWTRefreshToken = (req, res, next) => {
    const token = req.cookies?.jwtRefreshToken;
    if(!token) return res.status(401).json({success:false, message: "no refresh token"});

    jwt.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if(err) {
                res.status(403).json({success:false, message:"invalid refresh token"}); //invalid token
            } else {
                req.user = decoded.userInfo.username;
                req.roles = decoded.userInfo.roles;
            }
            next();
        }
    )
}

export const verifyJWTTokens = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(authHeader) {
        // auth header found, checkking for access token

        const accessToken = authHeader.split(' ')[1];
        if(!accessToken) res.status(403).json({success:false, message:"missing access token"}); //missing token token

        jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET,
            (err, decoded) => {
                if(err) return res.status(403).json({success:false, message:"invalid token"}); //invalid token
                    
                req.user = decoded.userInfo.username;
                req.roles = decoded.userInfo.roles;
                next();
            }
        );        
    } else {
        // no auth header, checking for refresh token

        const refrehToken = req.cookies?.jwtRefreshToken;
        if(!refrehToken) res.status(403).json({success:false, message:"missing refresh token"}); //missing token token

        jwt.verify(
            refrehToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if(err) return res.status(403).json({success:false, message:"invalid token"}); //invalid token

                req.user = decoded.userInfo.username;
                req.roles = decoded.userInfo.roles;
                next();
            }
        );        
    }    
}