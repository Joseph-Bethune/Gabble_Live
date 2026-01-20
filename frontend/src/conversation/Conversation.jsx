import React from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import NavButton from '../navButton/NavButton';
import ConversationBranch from "./conversationBranch/ConversationBranch.jsx";
import NewMessageForm from './newMessageForm/NewMessageForm.jsx';
import { getDisplayName, isLoggedIn, setStateFromSessionStorage } from '../userAuth/userAuthSlice.js';
import { getSendMessageThunkStatus, resetSendMessageThunkStatus, thunkStatuses } from './conversationSlice.js'
import ChangeTagsModal from './ChangeTagsModal/ChangeTagsModal.jsx';
import LeafContextMenu from './LeafContextMenu/LeafContextMenu.jsx';

const Conversation = () => {
    const dispatch = useDispatch();
    const { postId: dynamicRoutePostId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [actualPostId, setActualPostId] = useState();

    const [postToReplyTo, setPostToReplyTo] = useState(actualPostId);
    const isLoggedIn_redux = useSelector(isLoggedIn);

    const getSendMessageThunkStatus_redux = useSelector(getSendMessageThunkStatus);
    const rootPost = useSelector((state) => state.conversationSlice.posts[actualPostId])

    useEffect(() => {
        dispatch(setStateFromSessionStorage());
        if (dynamicRoutePostId) {
            setActualPostId(dynamicRoutePostId);
        } else if (searchParams.get('postId')) {
            setActualPostId(searchParams.get('postId'));
        }
    }, []);

    useEffect(() => {
        if (getSendMessageThunkStatus_redux == thunkStatuses.fulfilled) {
            dispatch(resetSendMessageThunkStatus());
        }
    }, [getSendMessageThunkStatus_redux]);

    useEffect(() => {
        if (!postToReplyTo) setPostToReplyTo(postToReplyTo);
    }, [actualPostId]);

    //#region handlers

    const replyClickHandlerDelegate = (messagePostId) => {
        const newPostToReplyTo = messagePostId == postToReplyTo ? actualPostId : messagePostId;
        setPostToReplyTo(newPostToReplyTo);
    }

    const cancelReplyModeDelegate = () => {
        setPostToReplyTo(actualPostId);
    }

    //#endregion

    //#region login data

    const getDisplayName_redux = useSelector(getDisplayName);

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

    //#region links

    const getLinks = () => {
        return [
            { text: "Search", dest: "/" }
        ]
    }

    //#endregion

    return (
        <div onContextMenu={(e) => contextMenuBaseClick(e)} onClick={(e) => baseClick(e)}>
            <title>Conversation</title>
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
                <NavButton links={getLinks()} showLogin={true} showRegistration={true} />
            </div>
            <div id="bodyDiv">
                <ConversationBranch
                    postId={actualPostId}
                    key={actualPostId}
                    replyClickHandlerDelegate={replyClickHandlerDelegate}
                    postToReplyTo={postToReplyTo}
                    rootPostId={actualPostId}
                    contextMenuDelegate={openMessagePostContextMenuDelegate}
                />
            </div>
            <div id="bottomBar">
                {isLoggedIn_redux ?
                    <NewMessageForm
                        postToReplyTo={postToReplyTo}
                        rootPostId={actualPostId}
                        cancelReplyModeDelegate={cancelReplyModeDelegate}
                        conversationMode={true}
                    /> :
                    <></>
                }
            </div>
        </div>
    )
}

export default Conversation