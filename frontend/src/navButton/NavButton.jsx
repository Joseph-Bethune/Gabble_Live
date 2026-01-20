import React from 'react'
import { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'
import { isLoggedIn, getUserName, getDisplayName } from '../userAuth/userAuthSlice';

import './NavButton.css'

const NavButton = (props) => {

    const navigate = useNavigate();
    const [showLinks, setShowLinks] = useState(false);
    const isLoggedIn_state = useSelector(isLoggedIn);
    const displayName = useSelector(getDisplayName);

    const generateLoginLinkButtons = (startingIndex) => {
        let index = startingIndex;
        let buttons = []
        if (isLoggedIn_state) {
            buttons = [
                <button
                    key={++index}
                    onClick={() => { navigate('/user') }}
                >
                    {displayName}
                </button>,
                props.showLogout == true || props.showLogout == null ?
                    <button
                        key={++index}
                        onClick={() => { navigate('/user/logout') }}
                    >
                        Sign Out
                    </button>
                    :
                    null
            ];
        } else {
            buttons = [
                props.showLogin == true ?
                    <button
                        key={++index}
                        onClick={() => { navigate('/user/login') }}
                    >
                        Sign In
                    </button>
                    :
                    null,
                props.showRegistration == true ?
                    <button
                        key={++index}
                        onClick={() => { navigate('/user/register') }}
                    >
                        Sign Up
                    </button>
                    :
                    null
            ];
        }
        buttons = buttons.filter((element) => element != null);
        return {
            buttons: buttons,
            nextKey: index + 1,
            divider: buttons.length > 0 ? <hr key={index + 1} /> : null,
        }
    }

    const generatePropLinkButtons = (startingIndex) => {
        let index = startingIndex;
        let buttons = [];

        if (props.links && props.links.length > 0) {
            buttons = props.links?.map((element) => {
                return <button
                    key={++index}
                    onClick={() => { navigate(element.dest) }}
                >
                    {element.text}
                </button>
            });
        }

        return {
            buttons,
            nextKey: index + 1,
            divider: buttons.length > 0 ? <hr key={index + 1} /> : null,
        }
    }

    const generateLinkButtons = () => {

        if (showLinks) {

            const { buttons: propButtons, nextKey: propButtonsDividerKey, divider: propButtonsDivider } = generatePropLinkButtons(1);
            const { buttons: authButtons, nextKey: authButtonsDividerKey, divider: authDivider } = generateLoginLinkButtons(propButtonsDividerKey + 1);

            return [
                <button
                    className="invertedButton"
                    key={0}
                    onClick={() => { setShowLinks(!showLinks) }}
                >
                    Hide Links
                </button>,
                ...(propButtonsDivider ? [propButtonsDivider] : []),
                ...propButtons,
                ...(authDivider ? [authDivider] : []),
                ...authButtons,
            ]
        } else {
            return <button
                className="invertedButton"
                key={0}
                onClick={() => {
                    setShowLinks(!showLinks);
                }}
            >
                Show Links
            </button>
        }
    }

    return (
        <div className='linkList fixedRightCorner'>
            {generateLinkButtons()}
        </div>
    )
}

export default NavButton