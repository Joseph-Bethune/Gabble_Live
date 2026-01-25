import React from 'react'
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { getChangeDisplayNameThunkStatusError, getLoginDataFromSS, setStateFromSessionStorage, thunkStatuses } from '../userAuthSlice.js'
import { useNavigate, Link } from 'react-router-dom';
import { getDisplayName, isLoggedIn } from '../userAuthSlice.js';
import { getChangeDisplayNameThunkStatus, changeDisplayNameThunk, resetChangeDisplayNameThunkStatus } from '../userAuthSlice.js';
import './Profile.css'
import '../styles/userAuth.css'
import VerticalNavBar from '../../VerticalNavBar/VerticalNavBar.jsx';

const Profile = () => {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const displayName_redux = useSelector(getDisplayName);
  const isLoggedIn_redux = useSelector(isLoggedIn);

  useEffect(() => {
    dispatch(setStateFromSessionStorage());
  }, []);

  //#region page

  const pages = {
    main: 0,
    settings: 1,
  }
  const [pageName, setPageName] = useState(pages.main);

  //endregion

  //#region settings content

  //#region new display name

  const [newDisplayName, setNewDisplayName] = useState("");
  const changeDisplayNameThunkStatus_redux = useSelector(getChangeDisplayNameThunkStatus);
  const changeDisplayNameThunkErrorMessage_redux = useSelector(getChangeDisplayNameThunkStatusError);

  const handleNewDisplayNameSubmit = () => {
    dispatch(changeDisplayNameThunk({ newDisplayName: newDisplayName }));
  }

  useEffect(() => {
    if (changeDisplayNameThunkStatus_redux == thunkStatuses.fulfilled) {
      dispatch(resetChangeDisplayNameThunkStatus());
    } else if (changeDisplayNameThunkStatus_redux == thunkStatuses.rejected) {
      dispatch(resetChangeDisplayNameThunkStatus());
    }
  }, [changeDisplayNameThunkStatus_redux])

  //#endregion

  const changeDisplayNameForm = () => {
    return <form className='profileForm' onSubmit={(e) => { e.preventDefault(); handleNewDisplayNameSubmit(); }}>
      <h2>Change Display Name</h2>
      <span className='errorMessageContainer' style={changeDisplayNameThunkErrorMessage_redux && changeDisplayNameThunkErrorMessage_redux.length > 0 ? {} : { display: 'none' }}>
        {changeDisplayNameThunkErrorMessage_redux}
      </span>
      <input
        type="text"
        id="newDisplayName"
        onChange={(e) => setNewDisplayName(e.target.value)}
        required
        value={newDisplayName}
        autoComplete='off'
        placeholder='New Display Name'
      />
      <button
        onClick={handleNewDisplayNameSubmit}
      >
        Update Display Name
      </button>
    </form>
  }

  const settingsContent = () => {
    return <div>
      {changeDisplayNameForm()}
      <hr />
    </div>
  }

  //#endregion

  //#region nav bar links

  const getLinks = () => {
    return [
      { text: "Search", dest: "/" }
    ]
  }

  //#endregion

  return (
    <div id='profileRoot'>
      <title>User Profile</title>
      <div id="topBar">
        <h1>{isLoggedIn_redux ? displayName_redux : "No user logged in."}</h1>
      </div>
      <div id='profileBodyRoot'>
        <VerticalNavBar links={getLinks()} />
        <div id='profileNav' className='test'>
          <button
            onClick={() => setPageName(pages.main)}
          >
            Main
          </button>
          <button
            onClick={() => setPageName(pages.settings)}
          >
            Settings
          </button>
        </div>
        <div id='profileMain'>
          {pageName == pages.main ? "Main" : pageName == pages.settings ? settingsContent() : "None"}
        </div>
      </div>
    </div>
  )
}

export default Profile;