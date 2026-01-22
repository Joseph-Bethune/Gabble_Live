import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const sliceName = "conversationSlice";

const initialState = {
    replyTargetPostId: null,
    rootPostId: null, 
    conversationMode: false,   
}

const conversationSlice = createSlice({
    name: sliceName,
    initialState: initialState,
    reducers: {        
        setReplyTargetPostId: (state, action) => {
            const postId = action.payload.postId;
            state.replyTargetPostId = postId;
        },
        setRootPostId: (state, action) => {
            const postId = action.payload.rootPostId;
            state.rootPostId = postId;
        },
        setConversationMode: (state, action) => {
            const newMode = action.payload.newMode;
            state.conversationMode = newMode;
        },
    },
});

export const getReplyTargetPostId = (state) => state.conversationSlice.replyTargetPostId;
export const getRootPostId = (state) => state.conversationSlice.rootPostId;
export const getConversationMode = (state) => state.conversationSlice.conversationMode;

export const {
    setReplyTargetPostId, setRootPostId, setConversationMode    
} = conversationSlice.actions;

export default conversationSlice.reducer;