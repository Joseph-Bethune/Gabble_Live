import React from 'react';
import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import ConversationBranch from '../conversationBranch/ConversationBranch.jsx';
import './SubBranches.css';

const SubBranches = (props) => {
    const dispatch = useDispatch();

    //#region show replies

    const [showReplies, setShowReplies] = useState(props.showReplies);

    useEffect(() => {
        setShowReplies(props.showReplies);
    }, [props.showReplies]);

    //#endregion

    //#region replies

    const [replyMessageIds, setReplyMessageIds] = useState(props.replyMessageIds);
    const [replyBranches, setReplyBranches] = useState([]);

    const arraysMatch = (array1, array2) => {
        if(array1.length != array2.length) return false;
        
        let contentMisMatch = array1.some((element) => {
            const found = array2.includes(element);
            return !found;
        });

        if(contentMisMatch) return false;

        contentMisMatch = array2.some((element) => {
            const found = array1.includes(element);
            return !found;
        });

        if(contentMisMatch) return false;

        return true;
    }

    useEffect(() => {        
        if (showReplies && props.replyMessageIds != null) {
            let update = false;
            if (replyMessageIds == null && props.replyMessageIds != null || replyMessageIds != null && props.replyMessageIds == null) {
                update = true;
            } else if (replyMessageIds.length != props.replyMessageIds.length) {
                update = true;
            } else {
                const contentMismatch = !arraysMatch(replyMessageIds, props.replyMessageIds);
                if (contentMismatch) {
                    update = true;
                }
            }
            if (update) {
                setReplyMessageIds(props.replyMessageIds);
            }
        }

    }, [props.replyMessageIds, showReplies]);

    useEffect(() => {
        updateReplyBranches();
    }, [replyMessageIds]);

    const updateReplyBranches = () => {
        if (replyMessageIds != null && replyMessageIds.length > 0) {
            setReplyBranches(replyMessageIds.map((id) => {
                return <ConversationBranch
                    leftMargin={props.leftMargin}
                    key={id}
                    postId={id}
                    replyClickHandlerDelegate={props.replyClickHandlerDelegate}
                    postToReplyTo={props.postToReplyTo}
                    rootPostId={props.rootPostId}
                />
            }));
        }
    }

    //#endregion

    return (
        <div>
            {showReplies ? [replyBranches] : <></>}
        </div>
    )
}

export default SubBranches