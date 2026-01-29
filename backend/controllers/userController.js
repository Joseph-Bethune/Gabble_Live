import bcrypt from 'bcrypt';
import { UserModel } from '../models/User.js';
import { PostModel } from '../models/Post.js';
import { getDefaultRoleCode } from '../middleware/verifyRoles.js'
import { logEvent } from '../middleware/eventLogger.js'
import { generateAccessToken, generateRefreshToken, decodeAccessToken, decodeRefreshToken, getCookieOptions } from '../middleware/verifyJWT.js';

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

const register = async (req, res) => {
    if (res.headersSent) return;

    // extract request data
    if (!req.body) return res.status(400).json({ success: false, error: 'Request is missing body data.' });
    const { email, password, displayName } = req.body;

    //#region missing request data checks

    if (!email) return res.status(400).json({ success: false, error: 'Password, email and displayName are required. You are missing the email.' });

    if (!password) return res.status(400).json({ success: false, error: 'Password, email and displayName are required. You are missing the password.' });

    if (!displayName) return res.status(400).json({ success: false, 'error': 'Password, email and displayName are required. You are missing the displayName.' });

    //#endregion

    // check for duplicate usernames in the db
    let duplicateUser = await UserModel.findOne({ email: email }).exec();
    if (duplicateUser) return res.status(409).json({ success: false, error: 'Cant register new user with that email: it is already in use.' });

    // check for duplicate usernames in the db
    duplicateUser = await UserModel.findOne({ displayName: displayName }).exec();
    if (duplicateUser) return res.status(409).json({ success: false, error: 'Cant register new user with that display name: it is already in use.' });

    try {
        // encrypt password
        const hashedPwd = await bcrypt.hash(password, 10);

        // get new user roles
        const newUserRoles = [getDefaultRoleCode()];

        // create and store new user
        const newUser = await UserModel.create({
            email: email,
            password: hashedPwd,
            displayName: displayName,
            roles: newUserRoles
        });

        // create jwt tokens
        const accessToken = generateAccessToken(newUser);
        const refreshToken = generateRefreshToken(newUser);

        newUser.refreshToken = refreshToken;
        await newUser.save();

        res.cookie('jwtRefreshToken', refreshToken, getCookieOptions());
        res.status(201).json({ 
            success: true, 
            message: `New user ${newUser.displayName} created.`, 
            id: newUser._id, 
            accessToken: accessToken, 
            displayName: newUser.displayName});
        return;
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

const login = async (req, res) => {
    if (res.headersSent) return;

    // extract request data
    if (!req.body) return res.status(400).json({ success:false, error: 'Request is missing body data.' });
    const { email, password } = req.body;

    //#region missing request data checks

    if (!email) return res.status(400).json({ success: false, error: 'Password, email and displayName are required. You are missing the email.' });

    if (!password) return res.status(400).json({ success: false, error: 'Password, email and displayName are required. You are missing the password.' });

    //#endregion

    const foundUser = await UserModel.findOne({ email: email }).exec();
    if (!foundUser) {
        logEvent(`A user tried to login with the email \"${email}\" and no matching user was found.`);
        return res.status(401).json({ success:false, error: "Login failed." });
    }

    const match = await bcrypt.compare(password, foundUser.password);

    if (match) {
        // create jwt tokens
        const accessToken = generateAccessToken(foundUser);
        const refreshToken = generateRefreshToken(foundUser);

        // saves the refresh token to the databse
        foundUser.refreshToken = refreshToken;
        const result = await foundUser.save();

        res.cookie('jwtRefreshToken', refreshToken, getCookieOptions());
        res.status(200).json({ success: true, message: `User ${foundUser.displayName} is logged in.`, accessToken: accessToken, displayName: foundUser.displayName });
        return;
    } else {
        logEvent(`A user tried to login with the email \"${email}\" and an incorrect password.`);
        res.status(401).json({ success:false, error: 'Login failed.' });
        return;
    }
}

const refreshLogin = async (req, res) => {
    if (res.headersSent) return;

    const tokenData = await decodeRefreshToken(req);

    // does the user have a refresh token
    const refreshToken = tokenData.refreshToken;
    if (!refreshToken) {
        logEvent("A user tried to refresh their login but no refresh token was present.");
        return res.status(401).json({ success: false, message: "User not authorized." });
    }

    // is refresh token in db
    const foundUser = await UserModel.findOne({refreshToken: refreshToken}).exec();
    if (!foundUser) {
        logEvent("A user tried to refresh their login but no match could be found for their refresh token.");
        return res.status(403).json({ success: false, message: "User not authorized." });
    }

    if (!tokenData.success) {
        if (foundUser.username) {
            logEvent(`A request to for a new access token using an out-of-date refresh token for ${foundUser.displayName} has been submitted. 
                Removing refresh token from database.`);

            //delete refresh token in database
            foundUser.refreshToken = "";
            const result = await foundUser.save();
        }

        if(tokenData.message){
            logEvent(tokenData.message);
        }

        return res.status(403).json({ success: false, message: "User not authorized."});
    }

    const accessToken = generateAccessToken(foundUser);
    return res.status(200).json({ success: true, accessToken: accessToken, displayName: foundUser.displayName, message: "Login successful." });
}

const logout = async (req, res) => {
    if (res.headersSent) return;

    // is refresh token in db
    const foundUser = req.userFromToken;
    if (!foundUser) return res.status(400).json({ success: false, message: `No match found for token.` });

    //delete refresh token in database
    foundUser.refreshToken = "";
    const result = await foundUser.save();

    res.clearCookie('jwtRefreshToken', getCookieOptions());
    return res.status(200).json({ success: true, message: `${foundUser.displayName} successfully logged out.` }); // secure: true - only serves on https
}

const changeDisplayName = async (req, res) => {
    if (res.headersSent) return;

    // assumes that the middleware has already decoded the token and attached the username to the request
    const userFromToken = req.userFromToken;
    if(!userFromToken) return res.status(400).json({ success: false, error: "Request couldn't find user from token." });

    if (!req.body) return res.status(400).json({ 'error': 'Request is missing body data.' });
    
    const newDisplayName = req.body?.newDisplayName;
    if(!newDisplayName) return res.status(400).json({ success: false, error: 'No new display name given.' });    

    // ensures that the new display name is not the same as the current display name
    const currentDisplayName = userFromToken.displayName;
    if(currentDisplayName.toLocaleLowerCase() == newDisplayName.toLocaleLowerCase()){
        return res.status(200).json({ success:false, error: "The new displayname is duplicate of the current displayname." });
    }
    
    // check display name validity
    const isDisplayNameValid = USERNAME_REGEX.test(newDisplayName);
    if(!isDisplayNameValid) return res.status(400).json({ success: false, error: `"${newDisplayName}" is not a valid display name.` });

    // check displayname uniqueness
    // must be unique among all current and past display names
    // when checking for uniqueness, convert both to lowercase
    const allUsers = await UserModel.find({});
    const isDisplayNameUnique = !allUsers.some((element) => {
        // if the current user is the on submitting the request, then skip this iteration
        if(`${element._id}` == `${userFromToken._id}`){
            //console.log("The current user being tested is the one who submitted the request. Skipping...");
            return false;            
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
    if(!isDisplayNameUnique) return res.status(400).json({ success: false, error: `The display name "${newDisplayName}" is taken.` });
    
    // add current display name to previous display names list
    {
        const previousDisplayNames = [...userFromToken.previousDisplayNames];
        const elementFound = previousDisplayNames.some((element) => {
            if(element.toLocaleLowerCase() == currentDisplayName.toLocaleLowerCase()){
                return true;
            }
        });

        if(!elementFound){
            previousDisplayNames.unshift(currentDisplayName);
            userFromToken.previousDisplayNames = previousDisplayNames.splice(0, 5);
        }
    }

    //change current display name
    userFromToken.displayName = newDisplayName;

    // applies update to database
    const status = await userFromToken.save();

    return res.status(200).json({success: true, newDisplayName:newDisplayName, message:`User's display name updated to ${newDisplayName}.`});
}

const getUserInfo = async (req, res) => {
    if (res.headersSent) return;

    if (!req.body) return res.status(400).json({ success: false, error: 'Request is missing body data.' });

    const tokenData = await decodeAccessToken(req);
    const userFromToken = tokenData.userFromToken;

    let searchTargetUser = null;
    const targetUserId = req.body?.userId;
    const targetUserDisplayName = req.body?.displayName;
    if (targetUserId) {
        searchTargetUser = await UserModel.findById(targetUserId).exec();
        if (!searchTargetUser) {
            return res.status(404).json({ success: false, message: `No user found with userId "${targetUserId}."` });
        }
    } else if (targetUserDisplayName) {
        searchTargetUser = await UserModel.findOne({ displayName: targetUserDisplayName }).exec();
        if (!searchTargetUser) {
            return res.status(404).json({ success: false, message: `No user found with displayName "${targetUserDisplayName}."` });
        }
    } else {
        return res.status(404).json({ success: false, message: `No search data sent, can't find user.` });
    }

    let output = {
        userId: searchTargetUser._id,
        displayName: searchTargetUser.displayName,
    }

    const hasPermission = (`${userFromToken?._id}` == `${searchTargetUser?._id}`); // the requester is verified to be the subject of the information request
    
    const allDataRequested = req.body.sendAllData;

    if (allDataRequested) {
        if (!hasPermission) {
            return res.status(200).json({
                success: true,
                userData: output,
                message: "You don't have permission to view anymore information."
            });
        }

        output.email = searchTargetUser.email;
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
        req.user = output.userFromToken;
        req.roles = output.userFromToken.roles;
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
    register,
    login,
    refreshLogin,
    logout,
    changeDisplayName,
    getUserInfo,
    checkAccessToken,
    checkRefreshToken,
    getAllUsers
};

export default userController;