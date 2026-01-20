import express from 'express';
import dotenv from 'dotenv';
import os from 'os';
import mongoose from 'mongoose';
import connectToMongoDB from './databaseConnections/MongoDB.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { corsOptions, credentials } from './middleware/corsOptions.js';
import { errorHandler } from './middleware/errorHandler.js';
import { loggerMiddleware } from './middleware/eventLogger.js';
import { checkRoles } from './models/UserRoles.js';
import rootRouter from './routes/rootRouter.js';

const app = express();
dotenv.config();

//#region get ipv4 address

function getIPv4Address() {
    // Iterate through network interfaces to find the desired IP address
    let networkInterfaces = os.networkInterfaces();
    if (networkInterfaces) {
        for (const interfaceName in networkInterfaces) {
            let interfaces = networkInterfaces[interfaceName];
            for (const iface of interfaces) {
                // Filter for IPv4 addresses that are not internal (loopback)
                if (iface.family === 'IPv4' && !iface.internal) {
                    return `${iface.address}`;
                }
            }
        }
    }
    return null;
}

//#endregion

//#region reading the request body

function applyRequestBodyMiddleware() {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.urlencoded({ extended: false }));
}

//#endregion

//#region cookie middleware

function applyMiddlewareForCookies() {
    app.use(cookieParser());
}

//#endregion

//#region cors middleware

function applyCorsMiddleWare() {
    app.use(credentials);
    app.use(cors(corsOptions));
}

//#endregion

//#region start server

const startServer = () => {
    const port = process.env.PORT;
    let ipAddress = process.env.IPV4_ADDRESS;
    app.listen(port, ipAddress, () => {
        ipAddress = getIPv4Address();
        console.log(`Server is running at address ${ipAddress} on port ${port}.`);
        console.log(`>>>> http://${ipAddress}:${port} <<<<`);
    });
}

//#endregion

//#region error handler middleware

function applyErrorHandlerMiddleware() {
    app.use(errorHandler);
}

//#endregion

//#region logger middleware

function applyLoggerMiddleware() {
    app.use(loggerMiddleware);
}

//#endregion

//#region routes

function applyRoutes() {
    app.use('/', rootRouter);
}

//#endregion

//#region main exectuion

const setupAndStartServer = () => {
    try {
        checkRoles();
        applyRequestBodyMiddleware();
        applyMiddlewareForCookies();
        applyCorsMiddleWare();
        applyErrorHandlerMiddleware();
        applyLoggerMiddleware();
        applyRoutes();
        startServer();
    } catch (exception) {
        console.log('There was an exception/error: ', exception);
        process.exit(1);
    }
}

const main = () => {
    console.log("\n\n_____New Server Start_____\n");
    connectToMongoDB();
    mongoose.connection.once('open', () => {
        setupAndStartServer();
    });
}

main();

//endregion