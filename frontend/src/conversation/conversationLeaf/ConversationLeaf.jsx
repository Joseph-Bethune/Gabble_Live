import React from 'react'
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { changeLikeStatusThunk, getPosts, thunkStatuses } from '../postDatabaseSlice.js';
import { findMessagesByIdThunk, getIdMessageSearchThunkStatus, resetIdSearchThunkStatus } from '../postDatabaseSlice.js';
import { sendMessageThunk, resetChangeLikeStatusThunkStatus, getChangeLikeStatusThunkStatus, postLikeStatuses } from '../postDatabaseSlice.js';
import { resetLeafUpdateStatus } from '../postDatabaseSlice.js';
import { getDisplayName, isLoggedIn } from '../../userAuth/userAuthSlice.js';

import './ConversationLeaf.css'
import { getConversationMode, getMessageSearchMode, getReplyTargetPostId, getRootPostId, setReplyTargetPostId, openMessagePostContextMenu } from '../conversationSlice.js';

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
        postId
        setMessageDataDelegate
        updatePostDelegate
        leafBodyClickHandlerDelegate
    //*/
    //#endregion

    const dispatch = useDispatch();
    
    const [posterName, setPosterName] = useState("");
    const [rawMessageText, setRawMessageText] = useState("");
    const [displayMessageText, setDisplayMessageText] = useState("");

    const [abreviate, setAbreviate] = useState(true);

    const idMessageSearchThunkStatus = useSelector(getIdMessageSearchThunkStatus);    

    const isLoggedIn_redux = useSelector(isLoggedIn);
    const userDisplayName_redux = useSelector(getDisplayName);  
    
    const replyTargetId = useSelector(getReplyTargetPostId);
    const rootPostId = useSelector(getRootPostId);

    const conversationMode = useSelector(getConversationMode);
    const messageSearchMode = useSelector(getMessageSearchMode);

    useEffect(() => {
        if (idMessageSearchThunkStatus == thunkStatuses.fulfilled) {
            dispatch(resetIdSearchThunkStatus());
            if (leafPost) {
                const localPosterName = leafPost.poster.displayName;
                setPosterName(`${localPosterName}${localPosterName == userDisplayName_redux ? " (You)" : ""}`);
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

    //#region postId and post 

    const [postId, setPostId] = useState();
    const leafPost = useSelector((state) => state.postDatabaseSlice.posts[postId]);

    useEffect(() => {
        if (props.postId !== postId) {
            setPostId(props.postId);
            dispatch(findMessagesByIdThunk({ postIds: [props.postId] }));
        }
    }, [props.postId]);

    //#endregion

    //#region leaf update

    const leafUpdateStatus = useSelector((state) => state.postDatabaseSlice.leafUpdateStatuses[postId] || thunkStatuses.idle);

    useEffect(() => {
        if (leafUpdateStatus == thunkStatuses.fulfilled) {
            dispatch(resetLeafUpdateStatus({ leafId: postId }));
            if (leafPost) {
                updateLikeStatuses(leafPost);
                updateTagDisplay(leafPost);
                if (props.updatePostDelegate) props.updatePostDelegate(leafPost);
            }
        } else if (leafUpdateStatus == thunkStatuses.updateNeeded) {
            if (postId) dispatch(findMessagesByIdThunk({ postIds: [postId] }));
        }
    }, [leafUpdateStatus]);

    //#endregion

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

    //#region response target selection

    const [isSelected, setSelected] = useState(false);

    const checkSelectionStatus = () => {
        const isReplyTarget = (replyTargetId == props.postId)
        const select = isReplyTarget;        

        setSelected(select);
    }

    useEffect(() => {
        checkSelectionStatus();        
    }, [props.postId, rootPostId, replyTargetId]);

    //#endregion

    //#region root element class

    const [rootElementClasses, setRootElementClasses] = useState("messageLeafMain");

    useEffect(() => {
        let selectedClassName = messageSearchMode ? "selectedHighlightableLeaf" : "selectedLeaf";
        let unselectedClassName = messageSearchMode ? "unselectedHighlightableLeaf" : "unslectedLeaf";      
        setRootElementClasses(`messageLeafMain${isSelected ? ` ${selectedClassName}`: ` ${unselectedClassName}`}`); 
    }, [isSelected, messageSearchMode]);

    //#endregion

    //#region click handlers

    const handleLikeClick = (e) => {
        e.stopPropagation();
        if (isLoggedIn_redux) {
            const newStatus = liked ? postLikeStatuses.neutral : postLikeStatuses.like;
            dispatch(changeLikeStatusThunk({ postId: postId, newStatus: newStatus }));
        }
    }

    const handleDislikeClick = (e) => {
        e.stopPropagation();
        if (isLoggedIn_redux) {
            const newStatus = disliked ? postLikeStatuses.neutral : postLikeStatuses.dislike;
            dispatch(changeLikeStatusThunk({ postId: postId, newStatus: newStatus }));
        }
    }

    const handleReplyClick = (e) => {
        e.stopPropagation();
        if(isSelected){
            if(conversationMode){
                if(rootPostId != postId){
                    dispatch(setReplyTargetPostId({postId: rootPostId}));
                }                
            } else {
                dispatch(setReplyTargetPostId({postId: null}));
            }
        } else {
            dispatch(setReplyTargetPostId({postId: postId}));
        }
    }

    const handleLeafBodyClick = (e) => {
        e.stopPropagation();
        if (props.leafBodyClickHandlerDelegate) props.leafBodyClickHandlerDelegate(postId);
    }
    
    //#endregion

    //#region leaf tags

    const [tagDisplay, setTagDisplay] = useState("");

    const updateTagDisplay = (leafData) => {
        if (!leafData.tags) return;

        setTagDisplay(leafData.tags.join(", "));
    }

    //#endregion

    //#region like/dislike status

    const changeLikeStatusThunkStatus = useSelector(getChangeLikeStatusThunkStatus);

    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [likeButtonClasses, setLikeButtonClasses] = useState("reactionCounters");

    const [disliked, setDisliked] = useState(false);
    const [dislikeCount, setDislikeCount] = useState(0);
    const [dislikeButtonClasses, setDislikeButtonClasses] = useState("reactionCounters");

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
        setLikeButtonClasses(`reactionCounters${isLoggedIn_redux && leafData.liked ? " liked" : ""}`);
        setDislikeButtonClasses(`reactionCounters${isLoggedIn_redux && leafData.disliked ? " disliked" : ""}`);
    }

    //#endregion

    //#region right click context

    const generateContextMenuRequestObject = (e, post) => {
        return {    
            positionX: e.clientX,
            positionY: e.clientY,
            targetPost: post,
            isOwnPost: (userDisplayName_redux == leafPost.poster.displayName)
        }
    }

    const handleOnContextMenu = (e) => {
        e.stopPropagation();
        e.preventDefault();
        dispatch(openMessagePostContextMenu(generateContextMenuRequestObject(e, leafPost)));
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
                    <button onClick={handleLikeClick} className={likeButtonClasses}>
                        Likes: {roundNumberToString(likeCount)}
                    </button>
                    <button onClick={handleDislikeClick} className={dislikeButtonClasses}>
                        Dislikes: {roundNumberToString(dislikeCount)}
                    </button>
                </span>
            </div>
        </div>
    )
}

export default ConversationLeaf