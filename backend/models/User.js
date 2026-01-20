import mongoose from "mongoose";
import {getDefaultRoleCode, getRoleCodesFromRoleNames} from '../middleware/verifyRoles.js';

const userSchema = new mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    roles: {type: [Number], default: [getDefaultRoleCode()], required: true},
    refreshToken: {type: String, required: false},
    displayName: {type: String, required: true},
    previousDisplayNames: {type: [String], required: false, default: []}
}, {timestamps: true});

export const UserModel = mongoose.model('User', userSchema);