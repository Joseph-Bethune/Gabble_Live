import React from 'react'
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sendMessageThunk } from '../conversationSlice';

import './NewMessageForm.css'

const NewMessageForm = (props) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const newMessageRef = useRef();

    const [newMessage, setNewMessage] = useState('');
    const [tags, setTags] = useState('');
    const [replyMessageLabel, setReplyMessageLabel] = useState('New Message');
    const [isReplyingToPost, setIsReplyingToPost] = useState(false);
    const [rootDivClasses, setRootDivClasses] = useState("formDiv");

    //#region root post id

    const [rootPostId, setRootPostId] = useState('');
    useEffect(() => {
        setRootPostId(props.rootPostId);
    }, [props.rootPostId]);

    //#endregion    

    const handleSubmitFormClick = async () => {
        if (newMessage.length > 0 && tags.length > 0) {            
            const output = { message: newMessage, responseTo: replyId, tags: tags };
            dispatch(sendMessageThunk(output));

            setNewMessage("");
            setTags("");
            if (props.cancelReplyModeDelegate) {
                props.cancelReplyModeDelegate();
            }
            if (newMessageRef.current) newMessageRef.current.blur();
        }
    }

    const handleCancelReplyClick = (e) => {
        e.preventDefault();
        if (props.cancelReplyModeDelegate) {
            props.cancelReplyModeDelegate();
        }
    }

    //#region reply target
    const [replyId, setReplyId] = useState("");    

    useEffect(() => {
        let output = null;
        if(props.postToReplyTo) {
            output = props.postToReplyTo;
        } else if(props.rootPostId) { 
            output = props.rootPostId;      
        }
        setReplyId(output);
    },[props.rootPostId, props.postToReplyTo]);

    useEffect(() => {
        let replyMode = false;
        
        if(props.conversationMode){
            if(props.postToReplyTo && props.postToReplyTo != props.rootPostId){
                replyMode = true;
            }
        } else {
            if(props.postToReplyTo){
                replyMode = true;
            }
        }

        if (replyMode) {
            setIsReplyingToPost(true);
            setReplyMessageLabel('New Reply');
            newMessageRef.current.focus();
        } else {
            setIsReplyingToPost(false);
            setReplyMessageLabel(props.conversationMode ? 'Reply to Root' : 'New Message');
        }

        setRootDivClasses(`${replyMode ? 'replyToPostMode ' : ''} formDiv`);
    }, [props.postToReplyTo, props.conversationMode, props.rootPostId]);

    //#endregion

    return (
        <div id="newMessageFormRoot" className={rootDivClasses}>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitFormClick(); }} style={{ alignContent: 'center', justifyContent: 'center'}}>
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
                                {isReplyingToPost ?
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
        </div>
    );
}

export default NewMessageForm