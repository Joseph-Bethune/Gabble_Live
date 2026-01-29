import express from 'express';
import userController from '../controllers/userController.js';
import { verifyJWTRefreshToken, verifyJWTAccessToken } from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refreshLogin', userController.refreshLogin);
router.post('/logout', verifyJWTRefreshToken, userController.logout);
router.post('/changeDisplayName', verifyJWTAccessToken, userController.changeDisplayName);
router.get('/getUserInfo', userController.getUserInfo);
router.get('/testAccessToken', userController.checkAccessToken);
router.get('/testRefreshToken', userController.checkRefreshToken);
router.get('/', userController.getAllUsers);

const userRouter = {
    path:"/users",
    router: router
}

export default userRouter;