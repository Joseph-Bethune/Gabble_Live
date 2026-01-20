import React from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import NavButton from '../navButton/NavButton';
import ConversationBranch from "./conversationBranch/ConversationBranch.jsx";
import NewMessageForm from './newMessageForm/NewMessageForm.jsx';
import { isLoggedIn, setStateFromSessionStorage } from '../userAuth/userAuthSlice.js';
import { getSendMessageThunkStatus, resetSendMessageThunkStatus, thunkStatuses } from './conversationSlice.js'

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
        if(getSendMessageThunkStatus_redux == thunkStatuses.fulfilled){
            dispatch(resetSendMessageThunkStatus());
        }
    }, [getSendMessageThunkStatus_redux]);

    useEffect(() => {
        if(!postToReplyTo) setPostToReplyTo(postToReplyTo);
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

    const getLinks = () => {
        return [
            { text: "Search", dest: "/" }
        ]
    }

    return (
        <div>
            <title>Conversation</title>
            <div id="topBar">
                <NavButton links={getLinks()} />
            </div>
            <div id="bodyDiv">
                <ConversationBranch
                    postId={actualPostId}
                    key={actualPostId}
                    replyClickHandlerDelegate={replyClickHandlerDelegate}
                    postToReplyTo={postToReplyTo}
                    rootPostId={actualPostId}
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