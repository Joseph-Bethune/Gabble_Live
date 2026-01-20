import { format } from 'date-fns';
import { v4 as uuid } from 'uuid';

function generateTimestampString() {
    return format(new Date(), 'yyyy-MM-dd\tHH:mm:ss');
}

function generateEventID() {
    return `${generateTimestampString()}\t${uuid()}`;
}

export function logEvent(message) {
    const logEntry = `${generateEventID()}\t${message}`;
    console.log();
    console.log(logEntry);
}

const generateLogStringFromHttpRequest = (req) => {
    return `Domain: ${req.domain}\tIp Address: ${req.socket.remoteAddress}\tMethod: ${req.method}\tRequested URL: ${req.originalUrl}`;
}

const generateLogStringFromHttpResponse = (res) => {
    return `Status Code: ${res.statusCode}`;
}

function logHttpRequest(req) {
    const reqData = generateLogStringFromHttpRequest(req);
    logEvent(reqData);
}

function logHttpRequestAndResponse(req, res) {

    const originalJson = res.json;
    res.json = function (body) {
        const reqData = generateLogStringFromHttpRequest(req);
        const resData = `${generateLogStringFromHttpResponse(res)}\tJSON response: ${JSON.stringify(body)}`;
        logEvent(`${reqData}\n${resData}\n`);
        originalJson.call(this, body);
    }    
}

function logHttpResponse(res) {

    const originalJson = res.json;
    res.json = function (body) {
        const resData = `Status Code: ${res.statusCode}\tJSON response: ${JSON.stringify(body)}`;
        logEvent(resData);
        originalJson.call(this, body);
    }    
}

export function requestLoggerMiddleware(req, res, next) {
    logHttpRequest(req);
    next();
}

export function responseLoggerMiddleware(req, res, next) {
    logHttpResponse(res);
    next();
}

export const loggerMiddleware = (req, res, next) => {
    logHttpRequestAndResponse(req,res);
    next();
}