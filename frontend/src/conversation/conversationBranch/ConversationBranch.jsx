import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { setStateFromSessionStorage } from '../../userAuth/userAuthSlice.js';
import { thunkStatuses } from '../postDatabaseSlice.js';
import { findMessagesByIdThunk, getIdMessageSearchThunkStatus, resetIdSearchThunkStatus } from '../postDatabaseSlice.js';
import ConversationBranch from './ConversationBranch.jsx';
import ConversationLeaf from '../conversationLeaf/ConversationLeaf.jsx';
import SubBranches from '../subBranches/SubBranches.jsx';

import './ConversationBranch.css';

const MessageBranch = (props) => {

    //#region expected props
    /*
        postId
        leftMargin
        contextMenuDelegate
        likeClickHandlerDelegate
        dislikeClickHandlerDelegate
    //*/
    //#endregion
    
    const dispatch = useDispatch();
    const divRef = useRef(null);

    const [showReplies, setShowReplies] = useState(false);

    const [leftMargin, setLeftMargin] = useState();

    useEffect(() => {
        if(divRef.current){
            const currentStyle = window.getComputedStyle(divRef.current);
            setLeftMargin(currentStyle.getPropertyValue('margin-left') + props.leftMargin);
        }
    }, []);
    
    //#region subelement handlers and delegates

    const updatePostDelegate = (newPostData) => {
        setReplyMessageIds(newPostData.responses);
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

    //#region reply message ids

    const [replyMessageIds, setReplyMessageIds] = useState([]);

    //#endregion

    //#region post id 

    const [postId, setPostId] = useState();

    useEffect(() => {
        setPostId(props.postId);
    }, [props.postId])

    //#endregion

    const style = {
        marginLeft: `${leftMargin}px`
    };

    return (
        <div className='branchMain' ref={divRef} style={style}>
            <ConversationLeaf
                postId={props.postId}
                likeClickHandlerDelegate={likeClickHandlerDelegate}
                dislikeClickHandlerDelegate={dislikeClickHandlerDelegate}
                setMessageDataDelegate={setMessageDataDelegate}
                updatePostDelegate={updatePostDelegate}                
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
                />
            </div>
        </div>
    )
}

export default MessageBranch