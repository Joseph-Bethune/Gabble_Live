import { PostModel } from '../models/Post.js'
import { UserModel } from '../models/User.js'
import { decodeAccessToken } from '../middleware/verifyJWT.js';
import mongoose from "mongoose";

const { Schema } = mongoose;

const postReactions = {
    like: 'like',
    dislike: 'dislike',
    neutral: 'neutral'
};

//#region helper functions

const generatePostOutputObject = async (postObject, user) => {
    const poster = await UserModel.findById(postObject.posterId).exec();
    const responses = await PostModel.find({responseTo: postObject._id}).exec();
    const postersName = poster?.displayName;

    const responseIds = responses.map((ele) => `${ele._id}`);

    const output = {
        id: `${postObject._id}`,
        message: postObject.message,
        tags: postObject.tags,
        poster: postersName,
        likes: postObject.likes.length,
        dislikes: postObject.dislikes.length,
        liked: (user ? postObject.likes.includes(user._id) : false),
        disliked: (user ? postObject.dislikes.includes(user._id) : false),
        responseTo: (postObject.responseTo ? `${postObject.responseTo}` : null),
        responses: (responseIds && responseIds.length > 0 ? responseIds : null),
        createdAt: postObject.createdAt,
        updatedAt: postObject.updatedAt,
        acceptsDirectReplies: postObject.acceptsDirectReplies
    };

    return output;
}

const convertToValidTagArray = (inputValue) => {
    if (!inputValue) return null;

    if(Array.isArray(inputValue)){
        if(inputValue.length <1) return null;
        return inputValue;
    }

    if (`${inputValue}`.length < 1) return null;

    return inputValue.split(',').map((rawTag) => rawTag.trim());
}

const isUserOnLikeList = (targetPost, targetUser) => {
    return targetPost.likes?.some((element) => {
        return element.equals(targetUser._id);
    });
}

const isUserOnDislikeList = (targetPost, targetUser) => {
    return targetPost.dislikes?.some((element) => {
        return element.equals(targetUser._id);
    });
}

const removeUserFromDislikeList = (targetPost, targetUser) => {
    targetPost.dislikes = [...new Set(targetPost.dislikes?.filter((element) => !element.equals(targetUser._id)))];
}

const removeUserFromLikeList = (targetPost, targetUser) => {
    targetPost.likes = [...new Set(targetPost.likes?.filter((element) => !element.equals(targetUser._id)))];
}

const addUserToDislikeList = (targetPost, targetUser) => {
    let tempList = targetPost.dislikes;
    tempList.push(targetUser._id);
    targetPost.dislikes = [...new Set(tempList)]
}

const addUserToLikeList = (targetPost, targetUser) => {
    let tempList = targetPost.likes;
    tempList.push(targetUser._id);
    targetPost.likes = [...new Set(tempList)]
}

//#endregion

//#region route handlers

const findPost = async (req, res) => {
    if (res.headersSent) return;

    // extract request data
    if (!req.body) return res.status(400).json({ 'error': 'Request is missing body data.' });

    // user token
    const tokenData = decodeAccessToken(req);
    let userFromToken = null;
    if (tokenData.success) {
        const foundUser = await UserModel.findOne({ username: tokenData.username }).exec();
        if (foundUser != null) {
            userFromToken = foundUser;
        }        
    }

    const postIds = req.body.postIds;

    if (postIds) {
             
        const foundPosts = await Promise.all(postIds.map(async (ele) => {
            const initialPost = await PostModel.findById(ele).exec(); 
            return generatePostOutputObject(initialPost, userFromToken);
        }));
        
        if (foundPosts) {
            return res.status(200).json({ success: true, posts: foundPosts })
        } else {
            return res.status(200).json({ success: true, message: `No post found with object id of ${postIds}.` });
        }
    } else {

        const includeTags = convertToValidTagArray(req.body.includeTags);

        const excludeTags = convertToValidTagArray(req.body.excludeTags);

        let searchCriteria = null;
        if (includeTags) {
            if (excludeTags) {
                searchCriteria = { tags: { $all: includeTags }, tags: { $nin: excludeTags } };
            } else {
                searchCriteria = { tags: { $all: includeTags } };
            }
        } else {
            if (excludeTags) {
                searchCriteria = { tags: { $nin: excludeTags } };
            } else {
                return res.status(200).json({ success: false, message: `I won't be able to find any posts without any includeTags, excludeTags or a postID.` });
            }
        }

        const foundPosts = await PostModel.find(searchCriteria).exec();

        const outputArray = await Promise.all(foundPosts.map((post) => generatePostOutputObject(post, userFromToken)));

        return res.status(200).json({ success: true, posts: outputArray });
    }

    return res.status(404).json({ success: false, message: `No posts found.` });
}

const createPost = async (req, res) => {
    if (res.headersSent) return;

    // assumes that the middleware has already decoded the token and attached the username to the request
    const userFromToken = await UserModel.findOne({ username: req.user }).exec();
    if (!userFromToken) return res.status(400).json({ 'error': "Request doesn't have a valid token." });

    if (!req.body) return res.status(400).json({ 'error': 'Request is missing body data.' });

    const { message: message, responseTo: responseTo } = req.body;

    //
    const tags = req.body.tags ? req.body.tags.split(",").map((rawTag) => rawTag.trim()) : [];

    //
    const responsePost = await PostModel.findById(responseTo).exec();
    if (responseTo) {
        if (!responsePost) return res.status(400).json({ success: false, error: "The post you are responding to doesn't exist." });
    }

    const result = await PostModel.create({
        message: message,
        tags: tags,
        posterId: userFromToken._id,
        responseTo: responsePost?._id || null
    });

    if (!result) return res.status(401).json({ success: false, error: "An unknown error has occured." });

    return res.status(200).json({ success: true, newPost: await generatePostOutputObject(result, userFromToken) });
}

const changeLikeStatus = async (req, res) => {
    if (res.headersSent) return;

    // assumes that the middleware has already decoded the token and attached the username to the request
    const userFromToken = await UserModel.findOne({ username: req.user }).exec();
    if (!userFromToken) return res.status(400).json({ 'error': "Request doesn't have a valid token." });

    if (!req.body) return res.status(400).json({ 'error': 'Request is missing body data.' });

    const newStatus = req.body.newStatus ? req.body.newStatus.toLowerCase() : null;
    if (newStatus !== postReactions.like && newStatus !== postReactions.dislike && newStatus !== postReactions.neutral) {
        return res.status(401).json({ success: false, error: `Invalid status: ${newStatus}`});
    }

    const postId = req.body.postId;
    const targetPost = await PostModel.findById(postId).exec();
    if (!targetPost) return res.status(401).json({ success: false, error: "Post not found." });

    if (newStatus === postReactions.like) {
        if (isUserOnDislikeList(targetPost, userFromToken)) {
            removeUserFromDislikeList(targetPost, userFromToken);
        }

        if (!isUserOnLikeList(targetPost, userFromToken)) {
            addUserToLikeList(targetPost, userFromToken);
        }

    } else if (newStatus === postReactions.dislike) {
        if (isUserOnLikeList(targetPost, userFromToken)) {
            removeUserFromLikeList(targetPost, userFromToken);
        }

        if (!isUserOnDislikeList(targetPost, userFromToken)) {
            addUserToDislikeList(targetPost, userFromToken);
        }
    } else {
        if (isUserOnLikeList(targetPost, userFromToken)) {
            removeUserFromLikeList(targetPost, userFromToken);
        }
        if (isUserOnDislikeList(targetPost, userFromToken)) {
            removeUserFromDislikeList(targetPost, userFromToken);
        }
    }

    const updateResult = await targetPost.save();

    return res.status(200).json({ success: true, error: "Status updated.", updatedPost: await generatePostOutputObject(targetPost, userFromToken)});
}

const changePostTags = async (req, res) => {
    if (res.headersSent) return;

    // assumes that the middleware has already decoded the token and attached the username to the request
    const userFromToken = await UserModel.findOne({ username: req.user }).exec();
    if (!userFromToken) return res.status(400).json({ success: false, 'error': "Request doesn't have a valid token." });

    if (!req.body) return res.status(400).json({ success: false, 'error': 'Request is missing body data.' });

    const newTags = convertToValidTagArray(req.body.newTags);
    if (!newTags || newTags.length < 1) return new res.status(401).json({ success: false, error: "The new tag(s) are invalid or missing." });

    const postId = req.body.postId;
    const targetPost = await PostModel.findById(postId).exec();
    if (!targetPost) return res.status(401).json({ success: false, error: "Post not found." });

    const hasAuthority = targetPost.posterId.equals(userFromToken._id);
    if (!hasAuthority) return new res.status(401).json({ success: false, error: "You don't have permission to do that." });

    // success
    targetPost.tags = newTags;
    const _ = await targetPost.save();

    return res.status(200).json({ success: true, updatedPost: await generatePostOutputObject(targetPost, userFromToken) });
}

//#endregion

const postController = {
    findPost: findPost,
    createPost: createPost,
    changeLikeStatus: changeLikeStatus,
    changePostTags: changePostTags,
}

export default postController