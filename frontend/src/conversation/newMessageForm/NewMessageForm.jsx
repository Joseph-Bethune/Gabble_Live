import React from 'react'
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sendMessageThunk } from '../postDatabaseSlice';
import { getRootPostId, setReplyTargetPostId, getReplyTargetPostId, getConversationMode } from '../conversationSlice';

import './NewMessageForm.css'
import { isLoggedIn } from '../../userAuth/userAuthSlice';

const NewMessageForm = (props) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const newMessageRef = useRef();

    const [newMessage, setNewMessage] = useState('');
    const [tags, setTags] = useState('');
    const [replyMessageLabel, setReplyMessageLabel] = useState('New Message');

    const replyTargetId = useSelector(getReplyTargetPostId);
    const rootPostId = useSelector(getRootPostId);
    const conversationMode = useSelector(getConversationMode);
    const isLoggedIn_redux = useSelector(isLoggedIn);

    //#region show/hide form

    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (conversationMode) {
            setShowForm(true);
        }
    }, [conversationMode, showForm]);

    //#endregion

    //#region unsorted handlers

    const cancelReply = () => {
        if (conversationMode) {
            dispatch(setReplyTargetPostId({ postId: rootPostId }));
        } else {
            dispatch(setReplyTargetPostId({ postId: null }));
        }
    }

    const handleSubmitFormClick = async () => {
        if (newMessage.length > 0 && tags.length > 0) {
            const output = { message: newMessage, responseTo: replyTargetId, tags: tags };
            dispatch(sendMessageThunk(output));

            setNewMessage("");
            setTags("");
            cancelReply();
            if (newMessageRef.current) newMessageRef.current.blur();
        }
    }

    const handleCancelReplyClick = (e) => {
        e.preventDefault();
        cancelReply();
    }

    //#endregion

    //#region reply mode

    const [isReplyingToPost, setIsReplyingToPost] = useState(false);
    const [isReplyingToRootPost, setIsReplyingToRootPost] = useState(false);

    useEffect(() => {

        if (replyTargetId) {
            setIsReplyingToPost(true);

            if (rootPostId) {
                setIsReplyingToRootPost(rootPostId == replyTargetId);
            } else {
                setIsReplyingToRootPost(false);
            }
        } else {
            setIsReplyingToPost(false);
            setIsReplyingToRootPost(false);
        }

    }, [replyTargetId, rootPostId]);

    //#endregion

    //#region set form classes


    //#endregion

    //#region form div classes

    const [formDivClasses, setFormDivClasses] = useState("formDiv");

    useEffect(() => {

        let isReplyingToRootPostLocal = false;
        if (isReplyingToRootPost) {
            isReplyingToRootPostLocal = true;
        } else if (conversationMode) {
            if (!replyTargetId) {
                isReplyingToRootPostLocal = true;
            }
        }
        let showFormLocal = showForm || isReplyingToPost || isReplyingToRootPostLocal;

        if (showFormLocal) {
            const basicDivClass = 'formDiv';
            const replyModeClass = 'replyToPostMode';
            setFormDivClasses(`${basicDivClass}${isReplyingToPost || isReplyingToRootPost ? ` ${replyModeClass}` : ''}`);
        } else {
            setFormDivClasses(`hidden`);
        }

        let messageLabel = "New Message";
        if (isReplyingToPost || isReplyingToRootPost) {
            messageLabel = "Reply To Post";
        }
        setReplyMessageLabel(messageLabel);

    }, [isReplyingToPost, isReplyingToRootPost, isLoggedIn_redux, showForm]);

    //#endregion

    //#region form toggle button style and disply

    const [formToggleButtonClasses, setFormToggleButtonClasses] = useState("formButton invertedButton toggleButton");
    const [formToggleButtonText, setFormToggleButtonText] = useState("Post New Message");

    useEffect(() => {
        updateToggleButtonDisplay();
    }, [isReplyingToPost, isReplyingToRootPost, conversationMode, isLoggedIn_redux, showForm]);


    const updateToggleButtonDisplay = () => {
        if (isLoggedIn_redux) {
            if (!conversationMode) {
                if (isReplyingToPost || showForm) {
                    setFormToggleButtonClasses("formButton invertedButton toggleButton");
                }

                if (isReplyingToPost) {
                    setFormToggleButtonText("Cancel Reply Message");
                } else if (showForm) {
                    setFormToggleButtonText("Cancel New Message");
                } else {
                    setFormToggleButtonText("Post New Message");
                }
            } else {
                setFormToggleButtonClasses("formButton invertedButton toggleButton");
            }
        } else {
            //setFormToggleButtonClasses("hidden");
        }
    }

    const formToggleClickHandler = () => {
        if (isLoggedIn_redux && !conversationMode) {
            if (isReplyingToPost) {
                cancelReply();
                setShowForm(false);
            } else {
                setShowForm(!showForm);
            }
        } else {
            // do nothing
        }
    }

    //#endregion

    return (
        <div id="newMessageFormRoot">
            <button
                onClick={formToggleClickHandler}
                className={formToggleButtonClasses}
            >
                {formToggleButtonText}
            </button>
            <span className={formDivClasses}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmitFormClick(); }} style={{ alignContent: 'center', justifyContent: 'center' }}>
                    <table>
                        <tbody>
                            <tr>
                                <td>
                                    <label htmlFor="newMessage">
                                        {replyMessageLabel}
                                    </label>
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        id="newMessage"
                                        ref={newMessageRef}
                                        autoComplete="off"
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        required
                                        value={newMessage}
                                    />
                                </td>
                                <td>
                                    <button
                                        onClick={handleSubmitFormClick}
                                        className="invertedButton"
                                    >
                                        Send
                                    </button>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <label htmlFor="tags">
                                        Tags
                                    </label>
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        id="tags"
                                        autoComplete="off"
                                        onChange={(e) => setTags(e.target.value)}
                                        required
                                        value={tags}
                                    />
                                </td>
                                <td>
                                    {isReplyingToPost || isReplyingToRootPost ?
                                        <button
                                            onClick={handleCancelReplyClick}
                                            className="invertedButton"
                                        >
                                            Cancel Reply
                                        </button> :
                                        <></>
                                    }
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </form>
            </span>
        </div>
    );
}

export default NewMessageForm