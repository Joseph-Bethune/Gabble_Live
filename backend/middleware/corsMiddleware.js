import { getIPv4Address } from '../server.js';
import { logEvent } from './eventLogger.js';

export const allowedOrigins = () => [    
];

export const corsMiddleware = (options = {}) => {
    const {
        credentials = true,
        methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        headers = ['Content-Type', 'Authorization', 'X-Requested-With'],
        maxAge = 86400,
        allowAll = false
    } = options;

    const origins = allowedOrigins();

    return (req, res, next) => {
        const requestOrigin = req.headers.origin;

        // Validate origin
        if (allowAll) {
            //logEvent(`CORS middleware is allowing all requests, including ${requestOrigin}`);
            
            res.header("Access-Control-Allow-Origin", requestOrigin);
            res.header("Vary", "Origin");

            if (credentials) {
                res.header("Access-Control-Allow-Credentials", "true");
            }
        } else {
            if (origins.includes(requestOrigin)) {
                //logEvent(`${requestOrigin} is an origin allowed by the CORS middleware.`);

                res.header("Access-Control-Allow-Origin", requestOrigin);
                res.header("Vary", "Origin");

                if (credentials) {
                    res.header("Access-Control-Allow-Credentials", "true");
                }
            } else {
                //logEvent(`${requestOrigin} is an origin NOT allowed by the CORS middleware.`);
            }
        }

        res.header("Access-Control-Allow-Methods", methods.join(", "));
        res.header("Access-Control-Allow-Headers", headers.join(", "));

        // Handle preflight
        if (req.method === 'OPTIONS') {
            res.header("Access-Control-Max-Age", maxAge.toString());
            return res.sendStatus(204);
        }

        next();
    };
}