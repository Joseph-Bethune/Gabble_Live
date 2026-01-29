import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { logoutUserThunk, getLogoutThunkStatus, thunkStatuses, resetLogoutThunkStatus, getDisplayName } from '../userAuthSlice.js'
import { getLoginDataFromSS } from '../userAuthSlice.js'
import { useNavigate } from 'react-router-dom';
import "../styles/userAuth.css";
import VerticalNavBar from '../../VerticalNavBar/VerticalNavBar.jsx';

const Logout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const displayName = useSelector(getDisplayName);
    const [accessToken, setAccessToken] = useState('');
    const [isLoggedIn, setisLoggedIn] = useState(false);

    const [wasDataPulledFromSession, setDataWasPulledFromSession] = useState(false);

    const logoutThunkStatus = useSelector(getLogoutThunkStatus);

    const handleLogout = (e) => {
        dispatch(logoutUserThunk());
    }

    const pullDataFromSession = () => {
        const tempData = getLoginDataFromSS();
        setAccessToken(tempData.accessToken);
        setisLoggedIn(Boolean(tempData.id) && Boolean(tempData.accessToken));
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
        }
    }, [logoutThunkStatus])

    const getLinks = () => {
        return [
            { text: "Search", dest: "/" }
        ]
    }

    return (
        <div>
            <title>User Logout</title>
            <div className="topBar">

            </div>
            <div id='bodyContainer'>
                <VerticalNavBar links={getLinks()} showLogout={false} />
                <div id='bodyDiv' className='centerDiv'>

                    <h2>{displayName}</h2>
                    <h2>Do you want to logout?</h2>
                    <button onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Logout