import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { thunkStatuses, setStateFromSessionStorage, } from '../userAuthSlice.js';
import { checkAccessTokenThunk, getCheckAccessTokenThunkStatus, resetCheckAccessTokenThunkStatus, } from '../userAuthSlice.js';
import { refreshLoginThunk, resetRefreshLoginThunkStatus, getRefreshLoginThunkStatus, getRefreshLoginThunkStatusError } from '../userAuthSlice.js';
import { setAuthStateFromStorageThunk, getAuthStateThunkStatus, getAuthStateThunkStatusError, resetSetAuthStateFromStorageThunkStatus } from '../userAuthSlice.js';
import {
    loginUserThunk, getLoginThunkStatus, getLoginThunkStatusError, resetLoginThunkStatus,
    isLoggedIn, getUserAccessToken, getUserName,
} from '../userAuthSlice.js';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NavButton from '../../navButton/NavButton.jsx';
import "../styles/userAuth.css";

const Login = (props) => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const userRef = useRef();
    const passwordRef = useRef();
    const { state } = useLocation();

    const [userName, setUserName] = useState('');
    const [userNameFocus, setUserNameFocus] = useState(false);
    const [validName, setValidName] = useState(false);

    const [pwd, setPwd] = useState('');
    const [pwdFocus, setPwdFocus] = useState(false);
    const [validPwd, setValidPwd] = useState(false);

    const isLoggedIn_redux = useSelector(isLoggedIn);
    const accessToken_redux = useSelector(getUserAccessToken);

    useEffect(() => {

        dispatch(setAuthStateFromStorageThunk());

        if (props.username) {
            setUserName(props.username);
            passwordRef.current.focus();
        } else if (state?.username) {
            setUserName(state.username);
            passwordRef.current.focus();
        } else {
            userRef.current.focus();
        }
    }, []);

    useEffect(() => {
        const result = userName && userName.length > 0;
        setValidName(result);
    }, [userName]);

    useEffect(() => {
        const validPwd = pwd && pwd.length > 0;
        setValidPwd(validPwd);

    }, [pwd]);

    //#region handlers

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(loginUserThunk({ username: userName, password: pwd }));
    }

    //#endregion

    //#region authstate from storage thunk data

    const authStateFromStorageThunkStatus = useSelector(getAuthStateThunkStatus);

    useEffect(() => {
        if (authStateFromStorageThunkStatus == thunkStatuses.fulfilled) {
            if (!isLoggedIn_redux) {
                if (accessToken_redux != null) {
                    dispatch(checkAccessTokenThunk());
                } else {
                    dispatch(refreshLoginThunk());
                }
            } else {
                navigate('/user/');
            }
        }

        if (authStateFromStorageThunkStatus == thunkStatuses.fulfilled || authStateFromStorageThunkStatus != thunkStatuses.rejected) {
            dispatch(resetSetAuthStateFromStorageThunkStatus());
        }
    }, [authStateFromStorageThunkStatus]);

    //#endregion

    //#region check access token thunk data

    const checkAccessTokenThunkStatus = useSelector(getCheckAccessTokenThunkStatus);

    useEffect(() => {
        if (checkAccessTokenThunkStatus == thunkStatuses.fulfilled) {
            if (isLoggedIn_redux) {
                navigate('/user/');
            } else {
                dispatch(refreshLoginThunk());
            }
        } else if (checkAccessTokenThunkStatus == thunkStatuses.rejected) {
            dispatch(refreshLoginThunk());
        }

        if (checkAccessTokenThunkStatus != thunkStatuses.idle && checkAccessTokenThunkStatus != thunkStatuses.pending) {
            dispatch(resetCheckAccessTokenThunkStatus());
        }
    }, [checkAccessTokenThunkStatus]);

    //#endregion

    //#region refresh login thunk data

    const refreshLoginThunkStatus = useSelector(getRefreshLoginThunkStatus);
    const refreshLoginThunkError = useSelector(getRefreshLoginThunkStatusError);

    useEffect(() => {
        if (refreshLoginThunkStatus == thunkStatuses.fulfilled) {
            if (isLoggedIn_redux) {
                navigate('/user/');
            }
        }

        if (refreshLoginThunkStatus != thunkStatuses.idle && refreshLoginThunkStatus != thunkStatuses.pending) {
            dispatch(resetRefreshLoginThunkStatus());
        }
    }, [refreshLoginThunkStatus]);

    //#endregion

    //#region login thunk status and error message

    const loginThunkStatus = useSelector(getLoginThunkStatus);
    const loginStatusError = useSelector(getLoginThunkStatusError);
    const [errorText, setErrorText] = useState(null);
    const [errorClasses, setErrorClasses] = useState("hidden");

    useEffect(() => {
        if (loginThunkStatus === thunkStatuses.fulfilled) {
            dispatch(resetLoginThunkStatus());
            navigate('/user/');
            resetLoginThunkStatus();
        } else if (loginThunkStatus == thunkStatuses.rejected) {
            if (loginStatusError != null) {
                setErrorText(loginStatusError);
                setErrorClasses("errorMessage");
                resetLoginThunkStatus();
            } else {
                setErrorText(null);
                setErrorClasses("hidden");
                resetLoginThunkStatus();
            }

        }
    }, [loginThunkStatus]);

    //#endregion

    //#region links

    const getLinks = () => {
        return [
            { text: "Search", dest: "/" }
        ]
    }

    //#endregion

    return (
        <div>
            <div className="topBar">
                <NavButton links={getLinks()} showRegistration={true} />
            </div>
            <div className='centerDiv rootDiv'>
                <title>User Login</title>
                <h1>Login</h1>
                <div className={errorClasses}>
                    {errorText}
                </div>
                <form className="verticalForm authForm" onSubmit={handleSubmit}>
                    <label htmlFor="username">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        ref={userRef}
                        autoComplete="off"
                        onChange={(e) => setUserName(e.target.value)}
                        required
                        onFocus={() => setUserNameFocus(true)}
                        onBlur={() => setUserNameFocus(false)}
                        value={userName}
                    />

                    <label htmlFor="password">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        ref={passwordRef}
                        onChange={(e) => setPwd(e.target.value)}
                        required
                        onFocus={() => setPwdFocus(true)}
                        onBlur={() => setPwdFocus(false)}
                        value={pwd}
                    />

                    <button disabled={!validName || !validPwd ? true : false} >
                        Login
                    </button>
                </form>
                <p>
                    Not registered?<br />
                    <Link to="/user/register">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;