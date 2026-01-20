import { configureStore } from "@reduxjs/toolkit";
import conversationReducer from '../conversation/conversationSlice.js'
import userAuthReducer from "../userAuth/userAuthSlice.js"

export const store = configureStore({
    reducer: {
        conversationSlice: conversationReducer,
        userAuthSlice: userAuthReducer
    }
});
