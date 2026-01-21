import {getIPv4Address} from '../server.js'

export const allowedOrigins = () => [
    `http://${getIPv4Address()}:${process.env.PORT}`,
    `http://localhost:${process.env.FRONTEND_PORT}`,
];

export const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins().indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error(`Request origin ${origin} not allowed by CORS`), false);
        }
    }
};

export const credentials_dev = (req, res, next) => {    
    const origin = req.headers?.origin;
    if(allowedOrigins().includes(origin)){
        if(!req.headersSent) {
            res.header('Access-Control-Allow-Credentials', true);
        }
    }
    next();
}

export const credentials = (req, res, next) => {
    if(!req.headersSent) {
        //res.header('Access-Control-Allow-Credentials', true);
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    }
    next();
}