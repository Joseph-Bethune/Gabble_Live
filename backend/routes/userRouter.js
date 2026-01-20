import express from 'express';
import userController from '../controllers/userController.js';
import { verifyJWTRefreshToken, verifyJWTAccessToken } from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/register', userController.registerNewUser);
router.post('/login', userController.handleLoginAttempt);
router.get('/refreshLogin', verifyJWTRefreshToken, userController.handleRefreshToken);
router.post('/logout', verifyJWTRefreshToken, userController.handleLogout);
router.post('/changeDisplayName', verifyJWTAccessToken, userController.changeDisplayName);
router.get('/getUserInfo', userController.getUserInfo);
router.get('/testAccessToken', userController.checkAccessToken);
router.get('/testRefreshToken', userController.checkRefreshToken);
router.get('/', userController.getAllUseres);

const userRouter = {
    path:"/users",
    router: router
}

export default userRouter;