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

    const updateSetShowReplies = () => {
        setShowReplies(!showReplies);        
    };

    const setMessageDataDelegate = (messageData) => {
        setReplyMessageIds(messageData.responses);
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
                setMessageDataDelegate={setMessageDataDelegate}
                updatePostDelegate={updatePostDelegate}                
            />
            <button className='replyExpansionButton' onClick={updateSetShowReplies}>
                {showReplies ? "/\\ Hide Replies /\\" : "\\/ Show Replies \\/"}
            </button>
            <div id='subBranchContainer' className='recursiveChildOffset'>
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