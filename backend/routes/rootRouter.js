import express from 'express';
import userRouter from './userRouter.js';
import postRouter from './postRouter.js';

//#region default router

const defaultRouter = express.Router();

defaultRouter.get('/', (req, res) => {
    if (!res.headersSent) {
        res.status(200).json({message:"You have successfully reached the api."});
    }
});

//#endregion


//#region root router

const rootRouter = express.Router();

//rootRouter.use('/', defaultRouter);
rootRouter.use(userRouter.path, userRouter.router);
rootRouter.use(postRouter.path, postRouter.router);

//#endregion

export default rootRouter;
