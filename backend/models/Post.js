import mongoose from "mongoose";
const { Schema } = mongoose;

const postSchema = new mongoose.Schema({
    message: {type: String, required: true},
    tags: {type: [String], required: true, default: []},
    posterId: {type: Schema.Types.ObjectId, ref: 'User', required: true},  
    likes: {type: [Schema.Types.ObjectId], ref: 'User', required: false, default: []}, 
    dislikes: {type: [Schema.Types.ObjectId], ref: 'User', required: false, default: []}, 
    responseTo: {type: Schema.Types.ObjectId, required: false, default: null},
    acceptsDirectReplies: {type: Boolean, required: false, default: true}
}, {timestamps: true});

export const PostModel = mongoose.model('Post', postSchema);