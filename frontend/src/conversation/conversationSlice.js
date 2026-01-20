import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from 'axios';

export const thunkStatuses = {
    idle: 'idle',
    pending: 'pending',
    rejected: 'rejected',
    fulfilled: 'fulfilled',
    updateNeeded: 'updateNeeded'
}

export const postLikeStatuses = {
    like: 'like',
    dislike: 'dislike',
    neutral: 'neutral'
};

const getAuthServerURL = () => {
    return `${import.meta.env.VITE_BACKEND_DOMAIN}:${import.meta.env.VITE_BACKEND_PORT}`
}

const sliceName = "conversationSlice";

//#region thunks

export const rootMessageSearchThunk = createAsyncThunk(
    `${sliceName}/searchForRootMessages`,
    async (params, thunkAPI) => {
        const state = thunkAPI.getState();

        const { includeTags, excludeTags } = params;
        const token = state.userAuthSlice.accessToken;

        const url = getAuthServerURL() + "/posts/find";
        const data = { includeTags, excludeTags };
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            },
            withCredentials: true
        }

        const response = await axios.post(
            url, data, config
        );

        if (response.data.success) {
            const postArray = response.data.posts.filter((element) => {
                return !element.responseTo;
            });
            const updatedPosts = {

            };
            postArray.forEach(element => {
                updatedPosts[element.id] = element;
            })
            return updatedPosts;
        } else {
            return null;
        }
    },
    {
        condition: (_, { getState }) => {
            // prevents the thunk for executing when in the wrong state
            const thunkStatus = getState().conversationSlice.thunkStatuses.rootSearch;
            if (thunkStatus == thunkStatuses.idle || thunkStatus == thunkStatus.rejected) {
                return true;
            }
            return false;
        }
    }
);

export const findMessagesByIdThunk = createAsyncThunk(
    `${sliceName}/searchForMessagesById`,
    async (params, thunkAPI) => {
        const state = thunkAPI.getState();

        const { postIds } = params;

        if (postIds) {

            const token = state.userAuthSlice.accessToken;

            const url = getAuthServerURL() + "/posts/find";
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                withCredentials: true
            }

            const data = { postIds: postIds };

            const response = await axios.post(
                url, data, config
            );

            if (response.data.success) {
                return response.data.posts;
            } else {
                return null;
            }
        } else {
            console.log("no missing posts...moving on...");
            return null;
        }
    },
    {
        condition: (_, { getState }) => {
            return true;

            // prevents the thunk for executing when in the wrong state
            const thunkStatus = getState().conversationSlice.thunkStatuses.idSearch;
            if (thunkStatus == thunkStatuses.idle || thunkStatus == thunkStatus.rejected) {
                return true;
            }
            return false;
        }
    }
);

export const changeLikeStatusThunk = createAsyncThunk(
    `${sliceName}/changeLikeStatus`,
    async (params, thunkAPI) => {
        const state = thunkAPI.getState();

        const { postId, newStatus } = params;

        const token = state.userAuthSlice.accessToken;

        const url = getAuthServerURL() + "/posts/changeLikeStatus";
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            },
            withCredentials: true
        }

        const data = { postId: postId, newStatus: newStatus };

        const response = await axios.post(
            url, data, config
        );

        if (response.data.success) {
            return response.data;
        } else {
            return null;
        }
    },
    {
        condition: (_, { getState }) => {
            return true;

            // prevents the thunk for executing when in the wrong state
            const thunkStatus = getState().conversationSlice.thunkStatuses.likeStatusChange;
            if (thunkStatus == thunkStatuses.idle || thunkStatus == thunkStatus.rejected) {
                return true;
            }
            return false;
        }
    }
);

export const sendMessageThunk = createAsyncThunk(
    `${sliceName}/sendMessage`,
    async (params, thunkAPI) => {
        const state = thunkAPI.getState();

        const { message, responseTo, tags } = params;

        const token = state.userAuthSlice.accessToken;

        const url = getAuthServerURL() + "/posts/create";
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            },
            withCredentials: true
        }

        const data = {
            message: message,
            responseTo: responseTo,
            tags: tags,
        };

        const response = await axios.post(
            url, data, config
        );

        if (response.data.success) {
            return response.data;
        } else {
            return null;
        }
    },
    {
        condition: (_, { getState }) => {
            return true;

            // prevents the thunk for executing when in the wrong state
            const thunkStatus = getState().conversationSlice.thunkStatuses.likeStatusChange;
            if (thunkStatus == thunkStatuses.idle || thunkStatus == thunkStatus.rejected) {
                return true;
            }
            return false;
        }
    }
);

export const changeTagsThunk = createAsyncThunk(
    `${sliceName}/changeTags`,
    async (params, thunkAPI) => {
        const state = thunkAPI.getState();

        const { postId, newTags } = params;

        const token = state.userAuthSlice.accessToken;

        const url = getAuthServerURL() + "/posts/changeTags";
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            },
            withCredentials: true
        }

        const data = {
            postId,
            newTags,
        };

        try {
            const response = await axios.post(
                url, data, config
            );
            return response.data;

        } catch (err) {
            return thunkAPI.rejectWithValue(err.response.data)
        }
    },
    {
        condition: (_, { getState }) => {
            return true;

            // prevents the thunk for executing when in the wrong state
            const thunkStatus = getState().conversationSlice.thunkStatuses.likeStatusChange;
            if (thunkStatus == thunkStatuses.idle || thunkStatus == thunkStatus.rejected) {
                return true;
            }
            return false;
        }
    }
);

//#endregion

//#endregion

const initialState = {
    thunkStatuses: {
        rootSearch: thunkStatuses.idle,
        idSearch: thunkStatuses.idle,
        changeLikeStatus: thunkStatuses.idle,
        sendMessage: thunkStatuses.idle,
        changeTags: { status: thunkStatuses.idle, error: null },
    },
    leafUpdateStatuses: {

    },
    rootPosts: {},
    posts: {},
}

const conversationSlice = createSlice({
    name: sliceName,
    initialState: initialState,
    reducers: {
        resetRootSearchThunkStatus: (state) => {
            state.thunkStatuses.rootSearch = thunkStatuses.idle;
        },
        resetIdSearchThunkStatus: (state) => {
            state.thunkStatuses.idSearch = thunkStatuses.idle;
        },
        resetChangeLikeStatusThunkStatus: (state) => {
            state.thunkStatuses.changeLikeStatus = thunkStatuses.idle;
        },
        resetSendMessageThunkStatus: (state) => {
            state.thunkStatuses.sendMessage = thunkStatuses.idle;
        },
        resetLeafUpdateStatus: (state, action) => {
            const leafId = action.payload.leafId;
            delete state.leafUpdateStatuses[leafId];
        },
        resetChangeTagsThunkStatus: (state) => {
            state.thunkStatuses.changeTags = { status: thunkStatuses.idle, error: null };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(rootMessageSearchThunk.pending, (state, action) => {
                state.thunkStatuses.rootSearch = thunkStatuses.pending;
            })
            .addCase(rootMessageSearchThunk.rejected, (state, action) => {
                state.thunkStatuses.rootSearch = thunkStatuses.rejected;
            })
            .addCase(rootMessageSearchThunk.fulfilled, (state, action) => {
                if (action.payload) {
                    const newPosts = {};
                    Object.values(action.payload).forEach((ele) => {
                        newPosts[ele.id] = ele;
                    });
                    state.rootPosts = newPosts;
                }
                state.thunkStatuses.rootSearch = thunkStatuses.fulfilled;
            }) // find messages by id thunk
            .addCase(findMessagesByIdThunk.pending, (state, action) => {
                const postIds = action.meta.arg.postIds;
                if (postIds) {
                    postIds.forEach((ele) => {
                        state.leafUpdateStatuses[ele] = thunkStatuses.pending;
                    })
                }
                state.thunkStatuses.idSearch = thunkStatuses.pending;
            })
            .addCase(findMessagesByIdThunk.rejected, (state, action) => {
                state.thunkStatuses.idSearch = thunkStatuses.rejected;
            })
            .addCase(findMessagesByIdThunk.fulfilled, (state, action) => {
                if (action.payload) {
                    const newBranchPosts = { ...(state.posts) };
                    action.payload.forEach((ele) => {
                        newBranchPosts[ele.id] = ele;
                        state.leafUpdateStatuses[ele.id] = thunkStatuses.fulfilled
                    });
                    state.posts = newBranchPosts;
                }
                state.thunkStatuses.idSearch = thunkStatuses.fulfilled;
            }) // like status change thunk
            .addCase(changeLikeStatusThunk.pending, (state, action) => {
                state.thunkStatuses.changeLikeStatus = thunkStatuses.pending;
                const postId = action.meta.arg.postId
                state.leafUpdateStatuses[postId] = thunkStatuses.pending;
            })
            .addCase(changeLikeStatusThunk.rejected, (state, action) => {
                state.thunkStatuses.changeLikeStatus = thunkStatuses.rejected;
            })
            .addCase(changeLikeStatusThunk.fulfilled, (state, action) => {
                state.posts[action.payload.updatedPost.id] = action.payload.updatedPost
                state.thunkStatuses.changeLikeStatus = thunkStatuses.fulfilled;
                const postId = action.meta.arg.postId;
                state.leafUpdateStatuses[postId] = thunkStatuses.fulfilled;
            }) // region send message thunk
            .addCase(sendMessageThunk.pending, (state, action) => {
                state.thunkStatuses.sendMessage = thunkStatuses.pending;
            })
            .addCase(sendMessageThunk.rejected, (state, action) => {
                state.thunkStatuses.sendMessage = thunkStatuses.rejected;
            })
            .addCase(sendMessageThunk.fulfilled, (state, action) => {
                state.posts[action.payload.newPost.id] = action.payload.newPost;
                state.thunkStatuses.sendMessage = thunkStatuses.fulfilled;
                const responseTo = action.meta.arg.responseTo;
                if (responseTo) {
                    state.leafUpdateStatuses[responseTo] = thunkStatuses.updateNeeded;
                }
            }) // region change tags thunk
            .addCase(changeTagsThunk.pending, (state, action) => {
                state.thunkStatuses.changeTags = { status: thunkStatuses.pending, error: null };
            })
            .addCase(changeTagsThunk.rejected, (state, action) => {
                state.thunkStatuses.changeTags = { status: thunkStatuses.rejected, error: action.payload.error };
            })
            .addCase(changeTagsThunk.fulfilled, (state, action) => {
                state.thunkStatuses.changeTags = { status: thunkStatuses.fulfilled, error: null };

                const updatedPost = action.payload.updatedPost
                state.posts[updatedPost.id] = updatedPost;
                state.leafUpdateStatuses[updatedPost.id] = thunkStatuses.fulfilled;
            })
    },
});

export const getRootPosts = (state) => state.conversationSlice.rootPosts;
export const getPosts = (state) => state.conversationSlice.posts;

// thunk statuses
export const getRootMessageSearchThunkStatus = (state) => state.conversationSlice.thunkStatuses.rootSearch;
export const getIdMessageSearchThunkStatus = (state) => state.conversationSlice.thunkStatuses.idSearch;
export const getChangeLikeStatusThunkStatus = (state) => state.conversationSlice.thunkStatuses.changeLikeStatus;
export const getSendMessageThunkStatus = (state) => state.conversationSlice.thunkStatuses.sendMessage;

export const getChangeTagsThunkStatus = (state) => state.conversationSlice.thunkStatuses.changeTags.status;
export const getChangeTagsThunkStatusError = (state) => state.conversationSlice.thunkStatuses.changeTags.error;


export const {
    resetRootSearchThunkStatus, resetIdSearchThunkStatus, resetChangeLikeStatusThunkStatus, resetSendMessageThunkStatus,
    resetLeafUpdateStatus, resetChangeTagsThunkStatus
} = conversationSlice.actions;

export default conversationSlice.reducer;