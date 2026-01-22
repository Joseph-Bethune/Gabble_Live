import React from 'react'
import { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isLoggedIn, setStateFromSessionStorage, getDisplayName } from '../../userAuth/userAuthSlice.js';
import { rootMessageSearchThunk, getRootMessageSearchThunkStatus, resetRootSearchThunkStatus, getRootPosts } from '../postDatabaseSlice.js';
import { thunkStatuses } from '../postDatabaseSlice.js';
import { getSendMessageThunkStatus, resetSendMessageThunkStatus } from '../postDatabaseSlice.js';
import ConversationLeaf from '../conversationLeaf/ConversationLeaf.jsx';
import NavButton from '../../navButton/NavButton.jsx';
import NewMessageForm from '../newMessageForm/NewMessageForm.jsx';
import ChangeTagsModal from '../ChangeTagsModal/ChangeTagsModal.jsx';
import LeafContextMenu from '../LeafContextMenu/LeafContextMenu.jsx';
import './MessageSearch.css'
import { getReplyTargetPostId, setConversationMode, setMessageSearchMode, setReplyTargetPostId, setRootPostId } from '../conversationSlice.js';

const MessageSearchPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [searchText, setSearchText] = useState('');

    const rootMessageSearchThunkStatus = useSelector(getRootMessageSearchThunkStatus);
    const rootPosts = useSelector(getRootPosts);

    const sendMessageThunkStatus = useSelector(getSendMessageThunkStatus);

    const postToReplyTo = useSelector(getReplyTargetPostId);
    const isLoggedIn_redux = useSelector(isLoggedIn);
    const getDisplayName_redux = useSelector(getDisplayName);    

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        executeSearch();
    }    

    useEffect(() => {
        dispatch(setStateFromSessionStorage());
        dispatch(setMessageSearchMode({newMode: true}));
        dispatch(setReplyTargetPostId({postId: null}));
        dispatch(setRootPostId({rootPostId: null}));
    }, []);

    useEffect(() => {
        if (sendMessageThunkStatus == thunkStatuses.fulfilled) {
            executeSearch();
            dispatch(resetSendMessageThunkStatus());
        }
    }, [sendMessageThunkStatus]);

    //#region root post display

    const [displayPosts, setDisplayPosts] = useState(null);

    const parseSearchString = (inputString) => {
        const subStrings = inputString.split(',').map((subString) => `${subString}`.trim()).filter((element) => element.length > 0);

        const includeTags = [];
        const excludeTags = [];

        subStrings.forEach((element) => {
            if (element.slice(0, 1) == '-') {
                excludeTags.push(element.slice(1));
            } else {
                includeTags.push(element);
            }
        });

        return {
            includeTags,
            excludeTags
        }
    }

    const executeSearch = () => {
        const searchObject = parseSearchString(searchText);
        dispatch(rootMessageSearchThunk(searchObject));
    }

    useEffect(() => {
        if (rootMessageSearchThunkStatus == thunkStatuses.fulfilled) {
            setDisplayPosts(generateRootPostDisplay());
        }
        if(rootMessageSearchThunkStatus != thunkStatuses.pending && rootMessageSearchThunkStatus != thunkStatuses.idle){
            dispatch(resetRootSearchThunkStatus());
        }
    }, [rootMessageSearchThunkStatus]);

    useEffect(() => {
        setDisplayPosts(generateRootPostDisplay());
    }, [postToReplyTo])

    const generateRootPostDisplay = () => {
        const output = Object.values(rootPosts).map((element) => {
            return <ConversationLeaf
                key={element.id}
                id={element.id}
                postId={element.id}
                highlightable={true}
                leafBodyClickHandlerDelegate={() => handleLeafBodyClick(element.id)}
                replyClickHandlerDelegate={replyClickHandlerDelegate}
                contextMenuDelegate={openMessagePostContextMenuDelegate}
            />
        })
        if (output && output.length > 0) {
            return output;
        } else {
            return <></>
        }
    }

    //#endregion

    //#region handlers

    const replyClickHandlerDelegate = (elementId) => {
        if (elementId == postToReplyTo) {
            dispatch(setReplyTargetPostId(null));
        } else {
            dispatch(setReplyTargetPostId(elementId));
        }
    }

    const handleLeafBodyClick = (elementId) => {
        navigate(`/convo?postId=${elementId}`);
    }

    const cancelReplyModeDelegate = () => {
        dispatch(setReplyTargetPostId(null));
    }

    //#endregion

    //#region context menu handler  

    const ownPost = (post) => {
        if (post) {
            if (isLoggedIn_redux && getDisplayName_redux == post.poster) {
                return true;
            }
        }
        return false;
    }

    const closeMessagePostContextMenuDelegate = () => {
        setMessagePostcontextMenuData({ ...messagePostContextMenuData, isOpen: false, targetPost: null });
    }

    const openMessagePostContextMenuDelegate = (e, post) => {
        e.preventDefault();
        openContextMenuForMessagePost(e, post);
    }

    const openChangeTagsMenuDelegate = (targetPost) => {
        setChangeTagsModalIsOpenDelegate(true, targetPost);
    }

    const defaultMessgePostContextMenuData = {
        isOpen: false,
        positionX: 0,
        positionY: 0,
        targetPost: null,
        ownPost: false,
    }

    const [messagePostContextMenuData, setMessagePostcontextMenuData] = useState(defaultMessgePostContextMenuData);

    const openContextMenuForMessagePost = (e, post) => {
        setMessagePostcontextMenuData({
            ...messagePostContextMenuData,
            isOpen: true,
            positionX: e.clientX,
            positionY: e.clientY,
            targetPost: post,
            ownPost: ownPost(post)
        });
    }

    const contextMenuBaseClick = (e) => {
        closeMessagePostContextMenuDelegate();
    }

    const baseClick = (e) => {
        closeMessagePostContextMenuDelegate();
    }

    //#endregion

    //#region change tags modal

    const defaultChangeTagsModalData = {
        isOpen: false,
        targetPost: null,
    }

    const [changeTagsModalData, setChangeTagsModalData] = useState(defaultChangeTagsModalData);

    const closeChangeTagsModalDelegate = () => {
        setChangeTagsModalData({
            ...changeTagsModalData,
            isOpen: false
        });
    }

    const setChangeTagsModalIsOpenDelegate = (newState, targetPost) => {
        setChangeTagsModalData({
            ...changeTagsModalData,
            targetPost: targetPost,
            isOpen: newState
        });
    }

    const submitChangeTagsDelegate = (post, newTags) => {

    }

    //#endregion

    return (
        <div id="pageRoot" onContextMenu={(e) => contextMenuBaseClick(e)} onClick={(e) => baseClick(e)}>
            <title>Search</title>
            <LeafContextMenu
                data={messagePostContextMenuData}
                closeMenu={closeMessagePostContextMenuDelegate}
                changeTags={openChangeTagsMenuDelegate}
            />
            <ChangeTagsModal
                data={changeTagsModalData}
                closeDelegate={closeChangeTagsModalDelegate}
                updateTags={submitChangeTagsDelegate}
            />
            <div id="topBar">
                <form id='horizontalForm' onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        id="search"
                        autoComplete="off"
                        onChange={(e) => setSearchText(e.target.value)}
                        value={searchText}
                    />
                    <button
                        className="invertedButton"
                    >
                        Search
                    </button>
                </form>
                <NavButton links={[]} showLogin={true} showRegistration={true} />
            </div>
            <div id="bodyDiv" className="searchResults">
                {displayPosts}
            </div>
            <div id="bottomBar" style={{ display: 'flex', flexDirection: 'column'}}>                
                <NewMessageForm
                    cancelReplyModeDelegate={cancelReplyModeDelegate}
                />
            </div>
        </div>
    )
}

export default MessageSearchPage;