import express from 'express';
import postController from '../controllers/postController.js';
import { verifyJWTAccessToken } from '../middleware/verifyJWT.js';

const router = express.Router();

router.post("/find", postController.findPost);
router.post("/create", verifyJWTAccessToken, postController.createPost);
router.post("/changeLikeStatus", verifyJWTAccessToken, postController.changeLikeStatus);
router.post("/changeTags", verifyJWTAccessToken, postController.changePostTags);

const postRouter = {
    path:"/posts",
    router: router
}

export default postRouter;