import { configureStore } from "@reduxjs/toolkit";
import postDatabaseSlice from '../conversation/postDatabaseSlice.js'
import userAuthSlice from "../userAuth/userAuthSlice.js"
import conversationSlice from "../conversation/conversationSlice.js";

export const store = configureStore({
    reducer: {
        postDatabaseSlice: postDatabaseSlice,
        userAuthSlice: userAuthSlice,
        conversationSlice: conversationSlice,
    }
});
