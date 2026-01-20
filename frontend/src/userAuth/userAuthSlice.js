import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from 'axios';

export const thunkStatuses = {
    idle: 'idle',
    pending: 'pending',
    rejected: 'rejected',
    fulfilled: 'fulfilled',
}

const initialState = {
    username: null,
    displayName: null,
    accessToken: null,
    thunkStatuses: {
        login: thunkStatuses.idle,
        refreshLogin: thunkStatuses.idle,
        registration: thunkStatuses.idle,
        logout: thunkStatuses.idle,
        checkAccessToken: thunkStatuses.idle,
        changeDisplayName: { status: thunkStatuses.idle, error: null },
    },
    error: null
};

const getAuthServerURL = () => {
    return `${import.meta.env.VITE_BACKEND_DOMAIN}:${import.meta.env.VITE_BACKEND_PORT}`
}

//#region saving user data to local session

export const saveLoginDataToSS = (username, accessToken, displayName) => {
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('displayName', displayName);
}

export const clearLoginDataFromSS = () => {
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('displayName');
}

export const getLoginDataFromSS = () => {
    const username = sessionStorage.getItem('username');
    const displayName = sessionStorage.getItem('displayName');
    const accessToken = sessionStorage.getItem('accessToken');

    return {
        username: username,
        accessToken: accessToken,
        displayName: displayName,
        isLoggedIn: (username != null && accessToken != null),
    }
}

//#endregion

//#region async thunks

export const registerNewUserThunk = createAsyncThunk(
    "userAuth/registerNewUser",
    async (params, thunkAPI) => {
        const state = thunkAPI.getState();
        const url = getAuthServerURL() + "/users/register";
        const { username, password } = params;

        const response = await axios.post(url, { username, password });

        return { ...response.data, username };
    }
);

export const loginUserThunk = createAsyncThunk(
    "userAuth/loginUser",
    async (params, thunkAPI) => {
        const state = thunkAPI.getState();
        const url = getAuthServerURL() + "/users/login";
        const { username, password } = params;

        const response = await axios.post(
            url,
            { username, password },
            { withCredentials: true }
        );

        return { ...response.data, username };
    }
);

export const refreshLoginThunk = createAsyncThunk(
    "userAuth/refreshLogin",
    async (params, thunkAPI) => {
        const state = thunkAPI.getState();

        const token = state.userAuthSlice.accessToken;

        const url = getAuthServerURL() + "/users/refreshLogin";
        const data = {};
        const config = {
            withCredentials: true
        };

        const response = await axios.get(
            url, config
        );

        return response.data;
    },
    {
        condition: (_, { getState }) => {
            // prevents the thunk for executing when in the wrong state
            const thunkStatus = getState().userAuthSlice.thunkStatuses.refreshLogin;
            if (thunkStatus == thunkStatuses.idle || thunkStatus == thunkStatus.rejected) {
                return true;
            }
            return false;
        }
    }
);

export const checkAccessTokenThunk = createAsyncThunk(
    "userAuth/checkAccessToken",
    async (params, thunkAPI) => {
        const state = thunkAPI.getState();

        const token = state.userAuthSlice.accessToken;

        const url = getAuthServerURL() + "/users/testAccessToken";
        const data = {};
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            },
            withCredentials: true
        };

        const response = await axios.get(
            url, config
        );

        if (response.data.success) {
            return true;
        } else {
            return false;
        }
    },
    {
        condition: (_, { getState }) => {
            // prevents the thunk for executing when in the wrong state
            const thunkStatus = getState().userAuthSlice.thunkStatuses.checkAccessToken;
            if (thunkStatus == thunkStatuses.idle || thunkStatus == thunkStatus.rejected) {
                return true;
            }
            return false;
        }
    }
);

export const logoutUserThunk = createAsyncThunk(
    "userAuth/logoutUser",
    async (params, thunkAPI) => {
        const state = thunkAPI.getState();
        const url = getAuthServerURL() + "/users/logout";

        const response = await axios.post(
            url,
            {},
            { withCredentials: true }
        );

        return response.data;
    }
);

export const changeDisplayNameThunk = createAsyncThunk(
    "userAuth/changeDisplayName",
    async (params, thunkAPI) => {
        const state = thunkAPI.getState();

        const { newDisplayName } = params;

        const token = state.userAuthSlice.accessToken;

        const url = getAuthServerURL() + "/users/changeDisplayName";
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            },
            withCredentials: true
        }

        const data = {
            newDisplayName: newDisplayName
        };

        try {
            const response = await axios.post(
                url, data, config
            );
            return response.data;
        } catch (err) {
            return thunkAPI.rejectWithValue(err.response.data);
        }
    },
    {
        condition: (_, { getState }) => {
            // prevents the thunk for executing when in the wrong state
            const thunkStatus = getState().userAuthSlice.thunkStatuses.changeDisplayName.status;
            if (thunkStatus == thunkStatuses.idle || thunkStatus == thunkStatus.rejected) {
                return true;
            } else {
                return false;
            }
        }
    }
)

//#endregion

const userAuthSlice = createSlice({
    name: "userAuthSlice",
    initialState,
    reducers: {
        resetRegistrationThunkStatus: (state) => {
            state.thunkStatuses.registration = thunkStatuses.idle;
        },
        resetLoginThunkStatus: (state) => {
            state.thunkStatuses.login = thunkStatuses.idle;
        },
        resetRefreshLoginThunkStatus: (state) => {
            state.thunkStatuses.refreshLogin = thunkStatuses.idle;
        },
        resetLogoutThunkStatus: (state) => {
            state.thunkStatuses.logout = thunkStatuses.idle;
        },
        resetCheckAccessTokenThunkStatus: (state) => {
            state.thunkStatuses.checkAccessToken = thunkStatuses.idle;
        },
        setStateFromSessionStorage: (state) => {
            const { username, accessToken, displayName } = getLoginDataFromSS();

            state.username = username;
            state.displayName = displayName;
            state.accessToken = accessToken;
        },
        resetChangeDisplayNameThunkStatus: (state) => {
            state.thunkStatuses.changeDisplayName.status = thunkStatuses.idle;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerNewUserThunk.pending, (state, action) => {
                state.thunkStatuses.registration = thunkStatuses.pending;
            })
            .addCase(registerNewUserThunk.rejected, (state, action) => {
                state.thunkStatuses.registration = thunkStatuses.rejected;
            })
            .addCase(registerNewUserThunk.fulfilled, (state, action) => {
                state.username = action.payload.username;
                state.thunkStatuses.registration = thunkStatuses.fulfilled;
            })
            .addCase(loginUserThunk.pending, (state, action) => {
                state.thunkStatuses.login = thunkStatuses.pending;
            })
            .addCase(loginUserThunk.rejected, (state, action) => {
                state.thunkStatuses.login = thunkStatuses.rejected;
            })
            .addCase(loginUserThunk.fulfilled, (state, action) => {
                state.accessToken = action.payload.accessToken;
                state.username = action.payload.username;
                state.displayName = action.payload.displayName;
                state.thunkStatuses.login = thunkStatuses.fulfilled;;
                saveLoginDataToSS(action.payload.username, action.payload.accessToken, action.payload.displayName);
            })
            .addCase(logoutUserThunk.pending, (state, action) => {
                state.thunkStatuses.logout = thunkStatuses.pending;
            })
            .addCase(logoutUserThunk.rejected, (state, action) => {
                state.thunkStatuses.logout = thunkStatuses.rejected;
            })
            .addCase(logoutUserThunk.fulfilled, (state, action) => {
                state.accessToken = null;
                state.username = null;
                state.displayName = null;
                state.thunkStatuses.logout = thunkStatuses.fulfilled;
                clearLoginDataFromSS();
            }) // check access token thunk below
            .addCase(checkAccessTokenThunk.pending, (state, action) => {
                state.thunkStatuses.checkAccessToken = thunkStatuses.pending;
            })
            .addCase(checkAccessTokenThunk.rejected, (state, action) => {
                state.thunkStatuses.checkAccessToken = thunkStatuses.rejected;
                state.accessToken = null;
                state.username = null;
                state.displayName = null;
                clearLoginDataFromSS();
            })
            .addCase(checkAccessTokenThunk.fulfilled, (state, action) => {
                if (action.payload) {

                } else {
                    state.accessToken = null;
                    state.username = null;
                    state.displayName = null;
                    clearLoginDataFromSS();
                }

                state.thunkStatuses.checkAccessToken = thunkStatuses.fulfilled;
            }) // refresh login thunk below
            .addCase(refreshLoginThunk.pending, (state, action) => {
                state.thunkStatuses.refreshLogin = thunkStatuses.pending;
            })
            .addCase(refreshLoginThunk.rejected, (state, action) => {
                state.thunkStatuses.refreshLogin = thunkStatuses.rejected;
            })
            .addCase(refreshLoginThunk.fulfilled, (state, action) => {
                state.accessToken = action.payload.accessToken;
                state.username = action.payload.username;
                state.displayName = action.payload.displayName;
                saveLoginDataToSS(action.payload.username, action.payload.accessToken, action.payload.displayName);

                state.thunkStatuses.refreshLogin = thunkStatuses.fulfilled;
            })// change display name thunk
            .addCase(changeDisplayNameThunk.pending, (state, action) => {
                state.thunkStatuses.changeDisplayName.status = thunkStatuses.pending;
            })
            .addCase(changeDisplayNameThunk.rejected, (state, action) => {
                state.thunkStatuses.changeDisplayName.status = thunkStatuses.rejected;
                if(action.payload.error){
                    state.thunkStatuses.changeDisplayName.error = action.payload.error;
                }
            })
            .addCase(changeDisplayNameThunk.fulfilled, (state, action) => {
                if (action.payload.success) {
                    const newDisplayName = action.payload.newDisplayName;
                    saveLoginDataToSS(state.username, state.accessToken, newDisplayName);
                    state.displayName = newDisplayName;
                }
                state.thunkStatuses.changeDisplayName.status = thunkStatuses.fulfilled;
                state.thunkStatuses.changeDisplayName.error = null;
            })
    }
});

export const isLoggedIn = (state) => (state.userAuthSlice.username != null && state.userAuthSlice.accessToken != null);
export const getUserName = (state) => state.userAuthSlice.username;
export const getDisplayName = (state) => state.userAuthSlice.displayName;
export const getUserAccessToken = (state) => state.userAuthSlice.accessToken;

// thunk statuses
export const getLoginThunkStatus = (state) => state.userAuthSlice.thunkStatuses.login;
export const getRefreshLoginThunkStatus = (state) => state.userAuthSlice.thunkStatuses.refreshLogin;
export const getRegistrationThunkStatus = (state) => state.userAuthSlice.thunkStatuses.registration;
export const getLogoutThunkStatus = (state) => state.userAuthSlice.thunkStatuses.logout;
export const getCheckAccessTokenThunkStatus = (state) => state.userAuthSlice.thunkStatuses.checkAccessToken;
export const getChangeDisplayNameThunkStatus = (state) => state.userAuthSlice.thunkStatuses.changeDisplayName.status;
export const getChangeDisplayNameThunkStatusError = (state) => state.userAuthSlice.thunkStatuses.changeDisplayName.error;

export const {
    resetRegistrationThunkStatus,
    resetLoginThunkStatus,
    resetRefreshLoginThunkStatus,
    resetLogoutThunkStatus,
    resetCheckAccessTokenThunkStatus,
    resetChangeDisplayNameThunkStatus,
    setStateFromSessionStorage, } = userAuthSlice.actions;

export default userAuthSlice.reducer;