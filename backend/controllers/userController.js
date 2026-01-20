import bcrypt from 'bcrypt';
import { UserModel } from '../models/User.js';
import { PostModel } from '../models/Post.js';
import { getDefaultRoleCode } from '../middleware/verifyRoles.js'
import { logEvent } from '../middleware/eventLogger.js'
import { generateAccessToken, generateRefreshToken, decodeAccessToken, decodeRefreshToken } from '../middleware/verifyJWT.js';

const jwtCookieOptions = true ?
    { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } : // testing only
    { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 }; //deployment

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;

const convertToOutputPostModel = (inputPostDoc) => {
    return {
        id: inputPostDoc._id,
        message: inputPostDoc.message,
        tags: inputPostDoc.tags,
        posterId: inputPostDoc.posterId,
        responseTo: inputPostDoc.responseTo,
        createdAt: inputPostDoc.createdAt,
        updatedAt: inputPostDoc.updatedAt,
    }
}

//#region route handlers

const handleRegisterAttempt = async (req, res) => {
    if (res.headersSent) return;

    // extract request data
    if (!req.body) return res.status(400).json({ 'error': 'Request is missing body data.' });
    const { username, password, displayName } = req.body;

    if (!username || !password) return res.status(400).json({ 'error': 'Username and password are required' });

    if (!displayName) return res.status(400).json({ 'error': 'Display name required.' });

    // check for duplicate usernames in the db
    let duplicateName = await UserModel.findOne({ username: username }).exec();
    if (duplicateName) return res.status(409).json({ 'error': 'Cant register new user with that name. User already exists.' });

    // check for duplicate usernames in the db
    duplicateName = await UserModel.findOne({ displayName: displayName }).exec();
    if (duplicateName) return res.status(409).json({ 'error': 'Cant register new user with that display name: it is already in use.' });

    try {
        // encrypt password
        const hashedPwd = await bcrypt.hash(password, 10);

        // get new user roles
        const newUserRoles = [getDefaultRoleCode()];

        // create and store new user
        const result = await UserModel.create({
            "username": username,
            "password": hashedPwd,
            "displayName": displayName,
            "roles": newUserRoles
        });

        res.status(201).json({ 'success': true, 'message': `New user ${result.username} created.` });
    } catch (error) {
        res.status(500).json({ 'message': error.message });
    }
}

const handleLoginAttempt = async (req, res) => {
    if (res.headersSent) return;

    // extract request data
    if (!req.body) return res.status(400).json({ 'error': 'Request is missing body data.' });
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).json({ 'error': 'Username and password are required' });

    const foundUser = await UserModel.findOne({ username: username }).exec();
    if (!foundUser) return res.status(401).json({ 'error': "No user with that username" });

    const match = await bcrypt.compare(password, foundUser.password);

    if (match) {
        // create jwt tokens
        const accessToken = generateAccessToken(foundUser);
        const refreshToken = generateRefreshToken(foundUser);

        // saves the refresh token to the databse
        foundUser.refreshToken = refreshToken;
        const result = await foundUser.save();

        res.cookie('jwtRefreshToken', refreshToken, jwtCookieOptions);
        res.status(200).json({ success: true, 'message': `User ${username} is logged in.`, 'accessToken': accessToken, 'displayName': foundUser.displayName });
        return;
    } else {
        res.status(401).json({ 'error': 'Incorrect password.' })
        return;
    }
}

const handleRefreshToken = async (req, res) => {
    if (res.headersSent) return;

    const tokenData = decodeRefreshToken(req);

    // does the user have a refresh token
    const refreshToken = tokenData.refreshToken;
    if (!refreshToken) return res.status(401).json({ success: false, message: "missing jwt refresh token" });

    // is refresh token in db
    const foundUser = await UserModel.findOne({ refreshToken: refreshToken }).exec();
    if (!foundUser) return res.status(403).json({ success: false });

    if (!tokenData.success) {
        if (foundUser.username) {
            logEvent(`A request to for a new access token using an out-of-date refresh token for ${foundUser.username} has been submitted. Removing refresh token from database.`);

            //delete refresh token in database
            foundUser.refreshToken = "";
            const result = await foundUser.save();
        }

        return res.status(403).json({ success: false });
    }

    const accessToken = generateAccessToken(foundUser);
    return res.status(200).json({ success: true, accessToken, username: foundUser.username, displayName: foundUser.displayName });
}

const handleLogout = async (req, res) => {
    // on client: also delete the access token

    if (res.headersSent) return;

    const refreshToken = req.cookies?.jwtRefreshToken
    if (!refreshToken) return res.status(400).json({ success: false, message: "no session cookies available" });

    // is refresh token in db
    const foundUser = await UserModel.findOne({ refreshToken: refreshToken }).exec();
    if (!foundUser) return res.status(400).json({ success: false, message: `No match found for token.` });

    //delete refresh token in database
    foundUser.refreshToken = "";
    const result = await foundUser.save();

    res.clearCookie('jwtRefreshToken', jwtCookieOptions);
    return res.status(200).json({ success: true, message: `${foundUser.username} successfully logged out.` }); // secure: true - only serves on https
}

const changeDisplayName = async (req, res) => {
    if (res.headersSent) return;

    // assumes that the middleware has already decoded the token and attached the username to the request
    const userFromToken = await UserModel.findOne({ username: req.user }).exec();
    if(!userFromToken) return res.status(400).json({ 'error': "Request doesn't have a valid token." });

    if (!req.body) return res.status(400).json({ 'error': 'Request is missing body data.' });
    
    const newDisplayName = req.body?.newDisplayName;
    if(!newDisplayName) return res.status(400).json({ success: false, 'error': 'No new display name given.' });    

    // ensures that the new display name is not the same as the current display name
    const currentDisplayName = userFromToken.displayName;
    if(currentDisplayName.toLocaleLowerCase() == newDisplayName.toLocaleLowerCase()){
        return res.status(200).json({ success:false, 'error': "The new displayname is duplicate of the current displayname." });
    }
    
    // check display name validity
    const isDisplayNameValid = USERNAME_REGEX.test(newDisplayName);
    if(!isDisplayNameValid) return res.status(400).json({ success: false, 'error': `"${newDisplayName}" is not a valid display name.` });

    // check displayname uniqueness
    // must be unique among all current and past display names
    // when checking for uniqueness, convert both to lowercase
    const allUsers = await UserModel.find({});
    const isDisplayNameUnique = !allUsers.some((element) => {
        // if the current user is the on submitting the request, then skip this iteration
        if(element.username === userFromToken.username){
            //console.log("The current user being tested is the one who submitted the request. Skipping...");
            return false;            
        }
        
        // checks new display name against any current user names
        if(element.username.toLocaleLowerCase() == newDisplayName.toLocaleLowerCase()){
            //console.log(`The requested display name matches username ${element.username}`);
            return true;
        }

        // checks new display name against any current display names
        if(element.displayName.toLocaleLowerCase() == newDisplayName.toLocaleLowerCase()){
            //console.log(`The requested display name matches the current displayname of user ${element.displayName}. Their current display name is (${element.displayName})`);
            return true;
        }

        // checks new display name against any past display names
        const elementMatch = element.previousDisplayNames.some((oldDisplayName) => {
            if(oldDisplayName.toLocaleLowerCase() == newDisplayName.toLocaleLowerCase()){
                //console.log(`The requeste display name matches an old displayname of user ${element.username}. The matched display name was (${oldDisplayName})`);
                return true;
            }
        });

        if(elementMatch){
            return true;
        }
    })
    if(!isDisplayNameUnique) return res.status(400).json({ success: false, 'error': `The display name "${newDisplayName}" is taken.` });
    
    // add current display name to previous display names list
    {
        const previousDisplayNames = [...userFromToken.previousDisplayNames];
        const elementFound = previousDisplayNames.some((element) => {
            if(element.toLocaleLowerCase() == currentDisplayName.toLocaleLowerCase()){
                return true;
            }
        });

        if(!elementFound){
            previousDisplayNames.push(currentDisplayName);
            userFromToken.previousDisplayNames = previousDisplayNames;
        }
    }

    //change current display name
    userFromToken.displayName = newDisplayName;

    // applies update to database
    const status = await userFromToken.save();

    return res.status(200).json({success: true, newDisplayName:newDisplayName, message:`${userFromToken.username}'s display name updated to ${newDisplayName}.`});
}

const getUserInfo = async (req, res) => {
    if (res.headersSent) return;

    if (!req.body) return res.status(400).json({ 'error': 'Request is missing body data.' });

    const tokenData = decodeAccessToken(req);
    let userFromToken = null;
    if (tokenData.success) {
        const foundUser = await UserModel.findOne({ username: tokenData.username }).exec();
        if (foundUser != null) {
            userFromToken = foundUser;
        }
    }

    let searchTargetUser = null;
    if (req.body?.userId) {
        searchTargetUser = await UserModel.findById(req.body.userId).exec();
        if (!searchTargetUser) {
            return res.status(404).json({ success: false, message: `No user found with userId "${req.body.userId}."` });
        }
    } else if (req.body?.displayName) {
        searchTargetUser = await UserModel.findOne({ displayName: req.body.displayName }).exec();
        if (!searchTargetUser) {
            return res.status(404).json({ success: false, message: `No user found with displayName "${req.body.displayName}."` });
        }
    } else {
        return res.status(404).json({ success: false, message: `No search data sent, can't find user.` });
    }

    let output = {
        userId: searchTargetUser._id,
        displayName: searchTargetUser.displayName,
    }

    const hasPermission = (
        (`${userFromToken?._id}` === `${searchTargetUser?._id}`) // the requester is verified to be the subject of the information request
    );

    const allDataRequested = req.body.sendAllData;

    if (allDataRequested) {
        if (!hasPermission) {
            return res.status(200).json({
                success: true,
                userData: output,
                message: "You don't have permission to view anymore information."
            });
        }

        output.previousDisplayNames = searchTargetUser.previousDisplayNames;
        const postsLiked = await Promise.all(
            (await PostModel.find({ likes: { $in : searchTargetUser._id} }).exec()).map((element) => convertToOutputPostModel(element))
        );
        const postsDisliked = await Promise.all(
            (await PostModel.find({ dislikes: { $in : searchTargetUser._id} }).exec()).map((element) => convertToOutputPostModel(element))
        );
        const allPostsMade = await Promise.all(
            (await PostModel.find({ posterId: searchTargetUser._id}).exec()).map((element) => convertToOutputPostModel(element))
        );
        let orignalPostsMade = [];
        let replyPostsMade = [];
        let postsRepliedTo = [];

        let _ = await Promise.all(allPostsMade.map(async (element) => {
            if(element.responseTo != null){
                replyPostsMade.push(element);
                const postRepliedTo = await PostModel.findById(element.responseTo).exec();
                if(postRepliedTo){
                    postsRepliedTo.push(convertToOutputPostModel(postRepliedTo));
                }
            } else {
                orignalPostsMade.push(element);
            }
            return null;
        }));

        output = {
            ...output,
            postsLiked,
            postsDisliked,
            orignalPostsMade,
            replyPostsMade,
            postsRepliedTo,
        }        

        return res.status(200).json({
            success: true,
            userData: output,
            message: "You have the required permission for the request to be fulfilled."
        });
    } else {
        return res.status(200).json({
            success: true,
            userData: output,
        });
    }
}

const checkAccessToken = (req, res) => {
    if (res.headersSent) return;

    const output = decodeAccessToken(req);

    if (!output) return res.status(401).json({ success: false, message: "unknown error decoding access token" });

    if (output.success) {
        req.user = output.username;
        req.roles = output.roles;
        res.status(200).json({ success: true, message: `Access token is valid.` });
    } else {
        res.status(403).json(output); //invalid token
    }

    return;
}

// for testing only, delete later

const getAllUsers = async (req, res) => {
    const foundUsers = await UserModel.find({}, { username: 1 }).exec();

    res.status(200).json(foundUsers);
    return;
}

const checkRefreshToken = (req, res) => {
    if (res.headersSent) return;

    const output = decodeRefreshToken(req);

    if (!output) return res.status(401).json({ success: false, message: "unknown error decoding refresh token" });

    if (output.success) {
        req.user = output.username;
        req.roles = output.roles;
        res.status(200).json({ success: true, message: `Refresh token for ${req.user} is valid.` });
    } else {
        res.status(403).json(output); //invalid token
    }

    return;
}

//#endregion

const userController = {
    registerNewUser: handleRegisterAttempt,
    handleLoginAttempt: handleLoginAttempt,
    handleRefreshToken: handleRefreshToken,
    handleLogout: handleLogout,
    changeDisplayName: changeDisplayName,
    getUserInfo: getUserInfo,
    checkAccessToken: checkAccessToken,
    checkRefreshToken: checkRefreshToken,
    getAllUseres: getAllUsers
};

export default userController;