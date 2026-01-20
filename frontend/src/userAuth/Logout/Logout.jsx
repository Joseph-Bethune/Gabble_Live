import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { logoutUserThunk, getLogoutThunkStatus, thunkStatuses, resetLogoutThunkStatus } from '../userAuthSlice.js'
import { getLoginDataFromSS } from '../userAuthSlice.js'
import { useNavigate } from 'react-router-dom';
import NavButton from '../../navButton/NavButton.jsx';
import "../styles/userAuth.css";

const Logout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [username, setUserName] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [isLoggedIn, setisLoggedIn] = useState(false);

    const [wasDataPulledFromSession, setDataWasPulledFromSession] = useState(false);

    const logoutThunkStatus = useSelector(getLogoutThunkStatus);

    const handleLogout = (e) => {
        dispatch(logoutUserThunk());
    }

    const pullDataFromSession = () => {
        const tempData = getLoginDataFromSS();
        setUserName(tempData.username);
        setAccessToken(tempData.accessToken);
        setisLoggedIn(Boolean(tempData.username) && Boolean(tempData.accessToken));
        setDataWasPulledFromSession(true);
    }

    useEffect(() => {
        pullDataFromSession();
    }, []);

    useEffect(() => {
        if (wasDataPulledFromSession) {
            if (!isLoggedIn) {
                navigate("/user/login/");
            }
        }
    }, [wasDataPulledFromSession])

    useEffect(() => {
        if (logoutThunkStatus === thunkStatuses.fulfilled) {
            dispatch(resetLogoutThunkStatus());
            navigate("/user/login/");
        }
    }, [logoutThunkStatus]);

    useEffect(() => {
        if (logoutThunkStatus === "successful") {
            resetLogoutThunkStatus();
            pullDataFromSession();
            console.log(username, isLoggedIn);
        }
    }, [logoutThunkStatus])

    const getLinks = () => {
        return [
            { text: "Search", dest: "/" }
        ]
    }

    return (
        <div>
            <div className="topBar">
                <NavButton links={getLinks()} showLogout={false} />
            </div>
            <div className='centerDiv rootDiv'>
                <title>User Logout</title>
                <h2>{username}</h2>
                <h2>Do you want to logout?</h2>
                <button onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </div>

    )
}

export default Logout