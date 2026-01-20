import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { setStateFromSessionStorage } from '../../userAuth/userAuthSlice.js';
import { thunkStatuses } from '../conversationSlice.js';
import { findMessagesByIdThunk, getIdMessageSearchThunkStatus, resetIdSearchThunkStatus } from '../conversationSlice.js';
import ConversationBranch from './ConversationBranch.jsx';
import ConversationLeaf from '../conversationLeaf/ConversationLeaf.jsx';
import SubBranches from '../subBranches/SubBranches.jsx';

import './ConversationBranch.css';

const MessageBranch = (props) => {

    const dispatch = useDispatch();
    const divRef = useRef(null);

    const [rootPostId, setRootPostId] = useState(props.postId);

    const [showReplies, setShowReplies] = useState(false);

    const [leftMargin, setLeftMargin] = useState();

    useEffect(() => {
        if(divRef.current){
            const currentStyle = window.getComputedStyle(divRef.current);
            setLeftMargin(currentStyle.getPropertyValue('margin-left') + props.leftMargin);
        }
    }, []);

    useEffect(() => {
        if(!rootPostId) return;
    }, [rootPostId]);

    useEffect(() => {
        if(props.postToReplyTo){
            
        }
    }, [props.postToReplyTo]);
    
    //#region subelement handlers

    const updatePostDelegate = (newPostData) => {
        setReplyMessageIds(newPostData.responses);
    }

    const replyClickHandlerDelegate = (messagePostId) => {
        if(props.replyClickHandlerDelegate){
            props.replyClickHandlerDelegate(messagePostId);
        }
    }
    const likeClickHandlerDelegate = (messagePostId) => {
        if(props.likeClickHandlerDelegate) props.likeClickHandlerDelegate(messagePostId)  
    }

    const dislikeClickHandlerDelegate = (messagePostId) => {
        if(props.dislikeClickHandlerDelegate) props.dislikeClickHandlerDelegate(messagePostId);        
    }

    const updateSetShowReplies = () => {
        setShowReplies(!showReplies);        
    };

    const setMessageDataDelegate = (messageData) => {
        setReplyMessageIds(messageData.responses);
    }

    //#endregion

    //#region context menu delegate

    const contextMenuDelegate = (e, post) => {
        if(props.contextMenuDelegate) props.contextMenuDelegate(e, post);
    }

    //#endregion

    //#region reply message branches

    const [replyMessageIds, setReplyMessageIds] = useState([]);

    //#endregion

    const style = {
        marginLeft: `${leftMargin}px`
    };

    // {showReplies && replyMessageIds && replyMessageIds.length > 0 ? [replyBranches] : <></>}
    return (
        <div className='branchMain' ref={divRef} style={style}>
            <ConversationLeaf
                postId={rootPostId}
                replyClickHandlerDelegate={replyClickHandlerDelegate}
                likeClickHandlerDelegate={likeClickHandlerDelegate}
                dislikeClickHandlerDelegate={dislikeClickHandlerDelegate}
                setMessageDataDelegate={setMessageDataDelegate}
                updatePostDelegate={updatePostDelegate}
                postToReplyTo={props.postToReplyTo}
                rootPostId={props.rootPostId}
                contextMenuDelegate={contextMenuDelegate}
            />
            <button className='replyExpansionButton' onClick={updateSetShowReplies}>
                {showReplies ? "/\\ Hide Replies /\\" : "\\/ Show Replies \\/"}
            </button>
            <div className='recursiveChildOffset'>
                <SubBranches 
                    showReplies={showReplies}
                    replyMessageIds={replyMessageIds}
                    leftMargin={leftMargin+50}
                    replyClickHandlerDelegate={props.replyClickHandlerDelegate}
                    postToReplyTo={props.postToReplyTo}
                    rootPostId={props.rootPostId}
                />
            </div>
        </div>
    )
}

export default MessageBranch