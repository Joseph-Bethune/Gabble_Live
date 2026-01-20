import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    loginUserThunk, getLoginThunkStatus, getUserName, thunkStatuses, resetLoginThunkStatus, setStateFromSessionStorage,
    checkAccessTokenThunk, getCheckAccessTokenThunkStatus, resetCheckAccessTokenThunkStatus,
    refreshLoginThunk, getRefreshLoginThunkStatus, resetRefreshLoginThunkStatus,
    isLoggedIn,
    getUserAccessToken,
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

    const loginThunkStatus = useSelector(getLoginThunkStatus);
    const checkAccessTokenThunkStatus = useSelector(getCheckAccessTokenThunkStatus);
    const refreshLoginThunkStatus = useSelector(getRefreshLoginThunkStatus);
    const isLoggedIn_redux = useSelector(isLoggedIn);
    const accessToken_redux = useSelector(getUserAccessToken);

    useEffect(() => {

        dispatch(setStateFromSessionStorage());

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
        if(!isLoggedIn_redux){
            if(accessToken_redux != null){
                dispatch(checkAccessTokenThunk());
            }            
        } else {
            navigate('/user/');
        }

    }, [isLoggedIn_redux, accessToken_redux]);

    useEffect(() => {
        if (checkAccessTokenThunkStatus == thunkStatuses.fulfilled) {
            dispatch(resetCheckAccessTokenThunkStatus());
            if (isLoggedIn_redux) {
                navigate('/user/');
            }
        } else if (checkAccessTokenThunkStatus == thunkStatuses.rejected) {
            dispatch(resetCheckAccessTokenThunkStatus());
            dispatch(refreshLoginThunk());
        }
    }, [checkAccessTokenThunkStatus]);

    useEffect(() => {
        dispatch(resetRefreshLoginThunkStatus());
        if (refreshLoginThunkStatus == thunkStatuses.fulfilled) {
            if (isLoggedIn_redux) {
                navigate('/user/');
            }
        }
    }, [refreshLoginThunkStatus]);

    useEffect(() => {
        const result = userName && userName.length > 0;
        setValidName(result);
    }, [userName]);

    useEffect(() => {
        const validPwd = pwd && pwd.length > 0;
        setValidPwd(validPwd);

    }, [pwd]);

    useEffect(() => {
        if (loginThunkStatus === thunkStatuses.fulfilled) {
            dispatch(resetLoginThunkStatus());
            navigate('/user/');
        }
    }, [loginThunkStatus]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(loginUserThunk({ username: userName, password: pwd }));
    }

    const getLinks = () => {
        return [
            {text:"Search", dest: "/"}
        ]
    }

    return (
        <div>
            <div className="topBar">
                <NavButton links={getLinks()} showLogin={false} />
            </div>
            <div className='centerDiv rootDiv'>
                <title>User Login</title>
                <h1>Login</h1>
                <form className="verticalForm" onSubmit={handleSubmit}>
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