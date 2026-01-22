import React from 'react';
import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import ConversationBranch from '../conversationBranch/ConversationBranch.jsx';
import './SubBranches.css';

const SubBranches = (props) => {


    /* expected props
        replyMessageIds
        showReplies
    //*/

    const dispatch = useDispatch();

    //#region delegates

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
        if (props.showReplies && props.replyMessageIds != null) {
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
                updateReplyBranches(props.replyMessageIds);
            }
        }

    }, [props.replyMessageIds, props.showReplies]);

    const updateReplyBranches = (ids) => {
        if (ids != null && ids.length > 0) {
            setReplyBranches(ids.map((id) => {
                return <ConversationBranch                    
                    key={id}
                    postId={id}
                    leftMargin={props.leftMargin}
                    replyClickHandlerDelegate={props.replyClickHandlerDelegate}                    
                />
            }));
        }
    }

    //#endregion

    return (
        <div style= {{display: props.showReplies ? 'block' : 'none'}}>
            {replyBranches}
        </div>
    )
}

export default SubBranches