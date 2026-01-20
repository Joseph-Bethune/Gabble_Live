import React from 'react'
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { changeLikeStatusThunk, getPosts, thunkStatuses } from '../conversationSlice.js';
import { findMessagesByIdThunk, getIdMessageSearchThunkStatus, resetIdSearchThunkStatus } from '../conversationSlice.js';
import { sendMessageThunk, resetChangeLikeStatusThunkStatus, getChangeLikeStatusThunkStatus, postLikeStatuses } from '../conversationSlice.js';
import { resetLeafUpdateStatus } from '../conversationSlice.js';
import { getDisplayName, isLoggedIn } from '../../userAuth/userAuthSlice.js';

import './ConversationLeaf.css'

const roundNumberToString = (number) => {
    let outputNumber = 0;
    let suffix = '';
    if (number >= 1000000000) {
        outputNumber = Math.floor(number / 1000000000);
        suffix = 'b';
    } else if (number >= 1000000) {
        outputNumber = Math.floor(number / 1000000);
        suffix = 'm';
    } else if (number >= 1000) {
        outputNumber = Math.floor(number / 1000);
        suffix = 'k';
    } else {
        outputNumber = number;
    }
    return `${outputNumber}${suffix}`;
}

const ConversationLeaf = (props) => {

    //#region expected props
    /*
        contextMenuDelegate(event, messagePost)
    //*/
    //#endregion
    
    const dispatch = useDispatch();
    const [leafPostId, setLeafPostId] = useState(props.postId);

    const [posterName, setPosterName] = useState("");
    const [rawMessageText, setRawMessageText] = useState("");
    const [displayMessageText, setDisplayMessageText] = useState("");

    const [abreviate, setAbreviate] = useState(true);    

    const idMessageSearchThunkStatus = useSelector(getIdMessageSearchThunkStatus);
    const leafPost = useSelector((state) => state.conversationSlice.posts[leafPostId]);    

    const isLoggedIn_redux = useSelector(isLoggedIn);
    const displayName_redux = useSelector(getDisplayName);

    useEffect(() => {

    }, []);

    useEffect(() => {
        if (!leafPostId) return;
        dispatch(findMessagesByIdThunk({ postIds: [leafPostId] }));
    }, [leafPostId]);

    useEffect(() => {
        if (idMessageSearchThunkStatus == thunkStatuses.fulfilled) {
            dispatch(resetIdSearchThunkStatus());
            if (leafPost) {
                setPosterName(`${leafPost.poster}${leafPost.poster == displayName_redux ? " (You)" : ""}`);
                setRawMessageText(leafPost.message);
                updateLikeStatuses(leafPost);
                updateTagDisplay(leafPost);
                setPostCreationTimeStamp(leafPost.createdAt);
                if (props.setMessageDataDelegate) {
                    props.setMessageDataDelegate(leafPost);
                }
            }
        }
    }, [idMessageSearchThunkStatus]);

    useEffect(() => {
        setDisplayMessageText(abreviate ? `${rawMessageText}`.substring(0, 100) : `${rawMessageText}`);
    }, [rawMessageText, abreviate]);

    //#region post creation time stamp

    const [postCreationTimeStamp, setPostCreationTimeStamp] = useState(null);
    const [postCreationTimeStampString, setPostCreationTimeStampString] = useState("");

    useEffect(() => {
        if (postCreationTimeStamp) {
            setPostCreationTimeStampString("Posted: " + format(postCreationTimeStamp, 'MMM dd, yyyy'));
        } else {
            setPostCreationTimeStampString("No creation timestamp.");
        }
    }, [postCreationTimeStamp]);

    //#endregion    

    //#region selectable leaf

    const [isSelected, setSelected] = useState(false);
    const [isSelectable, setSelectable] = useState(false);

    useEffect(() => {
        setSelectable(props.rootPostId != leafPostId);
    }, [props.rootPostId]);

    useEffect(() => {
        if (props.postToReplyTo == leafPostId && isSelectable) {
            setSelected(true);
        }
        else {
            setSelected(false);
        }
    }, [props.postToReplyTo, leafPostId, isSelectable])

    //#endregion

    //#region root element class

    const [rootElementClasses, setRootElementClasses] = useState("");

    useEffect(() => {
        if (isSelectable) {
            setRootElementClasses(`${isSelected ? 'selectedLeaf' : props.highlightable ? 'highlightableLeaf' : 'unselectedLeaf'} messageLeafMain`);
        } else {
            setRootElementClasses(`${props.highlightable ? 'highlightableLeaf' : 'unselectedLeaf'} messageLeafMain`);
        }
    }, [isSelected, props.highlightable, isSelectable]);

    //#endregion

    //#region click handlers

    const handleLikeClick = (e) => {
        e.stopPropagation();
        if (props.likeClickHandlerDelegate) props.likeClickHandlerDelegate(leafPostId);
        if (isLoggedIn_redux) {
            const newStatus = liked ? postLikeStatuses.neutral : postLikeStatuses.like;
            dispatch(changeLikeStatusThunk({ postId: leafPostId, newStatus: newStatus }));
        }
    }

    const handleDislikeClick = (e) => {
        e.stopPropagation();
        if (props.dislikeClickHandlerDelegate) props.dislikeClickHandlerDelegate(leafPostId);
        if (isLoggedIn_redux) {
            const newStatus = disliked ? postLikeStatuses.neutral : postLikeStatuses.dislike;
            dispatch(changeLikeStatusThunk({ postId: leafPostId, newStatus: newStatus }));
        }
    }

    const handleReplyClick = (e) => {
        e.stopPropagation();
        if (props.replyClickHandlerDelegate) props.replyClickHandlerDelegate(leafPostId);
    }

    const handleLeafBodyClick = (e) => {
        e.stopPropagation();
        if (props.leafBodyClickHandlerDelegate) props.leafBodyClickHandlerDelegate(leafPostId);
    }

    //#endregion

    //#region leaf tags

    const [tagDisplay, setTagDisplay] = useState("");

    const updateTagDisplay = (leafData) => {
        if(!leafData.tags) return;

        setTagDisplay(leafData.tags.join(", "));
    }

    //#endregion

    //#region like/dislike status

    const changeLikeStatusThunkStatus = useSelector(getChangeLikeStatusThunkStatus);

    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);

    const [disliked, setDisliked] = useState(false);
    const [dislikeCount, setDislikeCount] = useState(0);

    const getLikeStatusDisplay = () => {
        return isLoggedIn_redux ? liked ? "Y" : "N" : "";
    }

    const getDislikeStatusDisplay = () => {
        return isLoggedIn_redux ? disliked ? "Y" : "N" : "";
    }

    useEffect(() => {
        if (changeLikeStatusThunkStatus == thunkStatuses.fulfilled) {
            //dispatch(resetChangeLikeStatusThunkStatus());            
        }
    }, [changeLikeStatusThunkStatus]);

    const updateLikeStatuses = (leafData) => {
        setLiked(leafData.liked);
        setLikeCount(leafData.likes);
        setDisliked(leafData.disliked);
        setDislikeCount(leafData.dislikes);
    }

    //#endregion

    //#region leaf update

    const leafUpdateStatus = useSelector((state) => state.conversationSlice.leafUpdateStatuses[leafPostId] || thunkStatuses.idle);

    useEffect(() => {
        if(leafUpdateStatus == thunkStatuses.fulfilled){
            dispatch(resetLeafUpdateStatus({leafId: leafPostId}));
            if (leafPost) {
                updateLikeStatuses(leafPost);
                updateTagDisplay(leafPost);
                if(props.updatePostDelegate) props.updatePostDelegate(leafPost);
            }
        } else if(leafUpdateStatus == thunkStatuses.updateNeeded){
            if (leafPostId) dispatch(findMessagesByIdThunk({ postIds: [leafPostId] }));
        }
    }, [leafUpdateStatus]);
    
    //#endregion

    //#region right click context

    const handleOnContextMenu = (e) => {
        e.stopPropagation();
        if(props.contextMenuDelegate) {
            props.contextMenuDelegate(e, leafPost);
        }      
    }

    //#endregion

    return (
        <div className={rootElementClasses} onClick={handleLeafBodyClick} onContextMenu={(e) => handleOnContextMenu(e)}>
            <div id='messageLeafHeader'>{posterName}</div>
            <div id='messageLeafBody'>{displayMessageText}</div>
            <div>
                {
                    displayMessageText.length >= 100 ?
                        <button id='messageExpansionButton' onClick={() => setAbreviate(!abreviate)}>
                            {abreviate ? "\\/ Show All \\/" : "/\\ Show Less /\\"}
                        </button>
                        : <></>
                }
            </div>
            <div id="tagList">Tags: {tagDisplay}</div>
            <div id='messageLeafFooter'>
                <span id='timeStampSection'>{postCreationTimeStampString}</span>
                <span id='reactionSection'>
                    {isLoggedIn_redux ?
                        <button onClick={handleReplyClick} className='reactionCounters'>{isSelected ? "Cancel Reply" : "Reply"}</button> :
                        <></>
                    }
                    <button onClick={handleLikeClick} className='reactionCounters'>
                        {getLikeStatusDisplay()} Likes: {roundNumberToString(likeCount)}
                    </button>
                    <button onClick={handleDislikeClick} className='reactionCounters'>
                        {getDislikeStatusDisplay()} Dislikes: {roundNumberToString(dislikeCount)}
                    </button>
                </span>
            </div>
        </div>
    )
}

export default ConversationLeaf