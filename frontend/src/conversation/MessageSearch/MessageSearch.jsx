import React from 'react'
import { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isLoggedIn, setStateFromSessionStorage, getDisplayName } from '../../userAuth/userAuthSlice.js';
import { rootMessageSearchThunk, getRootMessageSearchThunkStatus, resetRootSearchThunkStatus, getRootPosts } from '../conversationSlice.js';
import { thunkStatuses } from '../conversationSlice.js';
import { getSendMessageThunkStatus, resetSendMessageThunkStatus } from '../conversationSlice.js';
import ConversationLeaf from '../conversationLeaf/ConversationLeaf.jsx';
import NavButton from '../../navButton/NavButton.jsx';
import NewMessageForm from '../newMessageForm/NewMessageForm.jsx';
import ChangeTagsModal from '../ChangeTagsModal/ChangeTagsModal.jsx';
import LeafContextMenu from '../LeafContextMenu/LeafContextMenu.jsx';
import './MessageSearch.css'

const MessageSearchPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [searchText, setSearchText] = useState('');

    const rootMessageSearchThunkStatus = useSelector(getRootMessageSearchThunkStatus);
    const rootPosts = useSelector(getRootPosts);

    const sendMessageThunkStatus = useSelector(getSendMessageThunkStatus);

    const [postToReplyTo, setPostToReplyTo] = useState("");
    const isLoggedIn_redux = useSelector(isLoggedIn);
    const getDisplayName_redux = useSelector(getDisplayName);

    const [isPostingNewMessage, setIsPostingNewMessage] = useState(false);
    const [newMessageButtonText, setNewMessageButtonText] = useState("Post New Message");
    const [newMessageButtonStyle, setNewMessageButtonStyle] = useState({display: 'block'});

    const formatSearchInput = (inputString) => {
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

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        executeSearch();        
    }

    const executeSearch = () => {
        const searchObject = formatSearchInput(searchText);
        dispatch(rootMessageSearchThunk(searchObject));
    }

    useEffect(() => {
        dispatch(setStateFromSessionStorage());
        document.documentElement.setAttribute('data-theme', 'light');
    }, []);

    useEffect(() => {
        if(sendMessageThunkStatus == thunkStatuses.fulfilled){
            executeSearch();
            dispatch(resetSendMessageThunkStatus());
        }
    }, [sendMessageThunkStatus]);

    //#region root post display

    const [displayPosts, setDisplayPosts] = useState(null);

    useEffect(() => {
        if (rootMessageSearchThunkStatus == thunkStatuses.fulfilled) {
            dispatch(resetRootSearchThunkStatus());
            setDisplayPosts(generateRootPostDisplay());
        }
    }, [rootMessageSearchThunkStatus]);

    useEffect(() => {
        setDisplayPosts(generateRootPostDisplay());
        updateToggleButtonClassList();
    }, [postToReplyTo])

    const generateRootPostDisplay = () => {
        const output = Object.values(rootPosts).map((element) => {
            return <ConversationLeaf
                key={element.id}
                id={element.id}
                postId={element.id}
                highlightable={true}
                postToReplyTo={postToReplyTo}
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
        if(elementId == postToReplyTo){
            setPostToReplyTo(null);
        } else {
            setPostToReplyTo(elementId);
        }        
    }

    const handleLeafBodyClick = (elementId) => {
        navigate(`/convo?postId=${elementId}`);
        //navigate(`/convo/${elementId}`);
    }

    const cancelReplyModeDelegate = () => {
        setPostToReplyTo(null);
    }

    const newMessageButtonHandler = () => {
        if(isPostingNewMessage){
            setIsPostingNewMessage(false);
            setNewMessageButtonText("Post New Message");
        } else {
            setIsPostingNewMessage(true);
            setNewMessageButtonText("Cancel New Message");
        }
    }

    //#endregion

    //#region styles

    const createNewMesssageFormStyle = () => {
        if ((postToReplyTo || isPostingNewMessage) && isLoggedIn_redux) {
            return {
                flexGrow: 1,
            }
        } else {
            return {
                display: 'none',
            }
        }
    }

    const updateToggleButtonClassList = () => {
        if(postToReplyTo != "" && postToReplyTo != null){
            setNewMessageButtonStyle("hidden");
        } else {
            setNewMessageButtonStyle("formButton invertedButton toggleButton");
        }
    }

    //#endregion

    //#region context menu handler  
    
    const ownPost = (post) => {
        if(post) {
            if (isLoggedIn_redux && getDisplayName_redux == post.poster){
                return true;
            }
        }
        return false;        
    }

    const closeMessagePostContextMenuDelegate = () => {
        setMessagePostcontextMenuData({...messagePostContextMenuData, isOpen: false, targetPost: null});
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
        <div id="elementRoot" onContextMenu={(e) => contextMenuBaseClick(e)} onClick={(e) => baseClick(e)}>
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
            <div id="bottomBar" style={{display: 'inline-flex'}}>
                <button
                    onClick={newMessageButtonHandler}
                    className={newMessageButtonStyle}
                >
                    {newMessageButtonText}
                </button>
                <span 
                    id="newMessageFormContainer"
                    style={createNewMesssageFormStyle()}
                >
                    <NewMessageForm
                        postToReplyTo={postToReplyTo}
                        cancelReplyModeDelegate={cancelReplyModeDelegate}
                    />
                </span>
            </div>
        </div>
    )
}

export default MessageSearchPage;