import { logEvent } from "./eventLogger.js";

export function errorHandler(err, req, res, next) {
    logEvent(`${err.name}: ${err.message}`);
    next();
}