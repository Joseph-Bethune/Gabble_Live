import React from 'react';
import ReactDom from 'react-dom';
import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetChangeTagsThunkStatus, getChangeTagsThunkStatus, getChangeTagsThunkStatusError, changeTagsThunk, thunkStatuses } from '../conversationSlice.js';
import '../../main/main.css';
import './ChangeTagsModal.css';

const ChangeTagsModal = (props) => {

    //#region expected props
    /*
        data.isOpen boolean
        data.targetPost post
        closeDelegate function()
        updateTags function(post, string array)        
    //*/
    //#endregion

    const dispatch = useDispatch();

    const newTagsInputRef = useRef(null);
    const [targetPost, setTargetPost] = useState({});

    //#region new tags

    const [newTagsRaw, setNewTagsRaw] = useState("");

    useEffect(() => {
        if (props.data.isOpen) {
            if (props.data.targetPost) {
                setNewTagsRaw(props.data.targetPost.tags.join(", "));
                setTargetPost(props.data.targetPost);
                changeErrorMessage(null);
                if (newTagsInputRef.current != null) {
                    newTagsInputRef.current.focus();
                }
            }
        }
    }, [props.data.isOpen]);

    //#endregion

    //#region error Message

    const [errorMessage, setErrorMessage] = useState(null);
    const [errorMessageClasses, setErrorMessageClasses] = useState("hidden");

    const changeErrorMessage = (newMessage) => {
        if (newMessage && newMessage.length > 0) {
            setErrorMessage(newMessage);
            setErrorMessageClasses("errorMessage");
        } else {
            setErrorMessage(null);
            setErrorMessageClasses("hidden");
        }
    }

    //#endregion

    //#region open/close modal

    //backup open/close flag hook
    const [isOpen_bu, setIsOpen_bu] = useState(true);

    const isOpen = () => {
        if (props.data?.isOpen != null) {
            return props.data.isOpen;
        } else {
            return isOpen_bu;
        }
    }

    //#endregion

    //#region handlers

    const arraysMatch = (arr1, arr2) => {
        if (arr1.length != arr2.length) return false;

        //
        let missingElements = arr1.some((element) => {
            if (!arr2.includes(element)) {
                return true;
            } else {
                return false;
            }
        });

        if (missingElements) return false;

        //
        missingElements = arr2.some((element) => {
            if (!arr1.includes(element)) {
                return true;
            } else {
                return false;
            }
        });

        if (missingElements) return false;

        return true;
    }

    const closeModalButtonHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (props.closeDelegate) props.closeDelegate();
    }

    const changeTagsThunkStatus = useSelector(getChangeTagsThunkStatus);
    const changeTagsThunkStatusError = useSelector(getChangeTagsThunkStatusError);

    useEffect(() => {
        if(changeTagsThunkStatus == thunkStatuses.fulfilled){
            dispatch(resetChangeTagsThunkStatus());
            if (props.closeDelegate) props.closeDelegate();
        } else if (changeTagsThunkStatus == thunkStatuses.rejected) {
            changeErrorMessage(changeTagsThunkStatusError);
            dispatch(resetChangeTagsThunkStatus());            
        }
    }, [changeTagsThunkStatus])

    const submitModalFormHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // converts raw tag string into formatted tag array
        const newTags = [...new Set(newTagsRaw.split(/[,\s]/))]. // removes duplicate tags
            filter((element) => element.length > 0). // removes tags that are 0-length strings
            map((element) => element.trim()); // removes white spaces from start and end of tags


        // check for duplicat tag array
        const tagsAreNew = !arraysMatch(targetPost.tags, newTags);

        if (tagsAreNew) {
            dispatch(changeTagsThunk({ postId: targetPost.id, newTags: newTags }));

            if (props.updateTags) {
                props.updateTags(targetPost, newTags);
            }
        } else {
            changeErrorMessage("This new tag set is a duplicate of the current set of tags.");
        }
    }

    //#endregion

    return ReactDom.createPortal(
        <div style={isOpen() ? {} : { display: 'none' }}>
            <div className="modalOverlay"></div>
            <form className="modalBase changeTagsForm" onSubmit={submitModalFormHandler}>
                <button
                    className="exitButton"
                    type="button"
                    onClick={closeModalButtonHandler}
                >
                    X
                </button>
                <div className="modalTitleBar">Change Tags Modal</div>
                <div className={errorMessageClasses}>
                    {errorMessage}
                </div>
                <span className="formRow">
                    <label htmlFor="newTags">
                        New Tags :
                    </label>
                    <input
                        type="text"
                        id="newTags"
                        ref={newTagsInputRef}
                        onChange={(e) => setNewTagsRaw(e.target.value)}
                        required
                        autoComplete='off'
                        value={newTagsRaw}
                    />
                </span>
                <span className="formRow" style={{ alignSelf: 'center' }}>
                    <button
                        type="button"
                        onClick={closeModalButtonHandler}
                    >
                        Cancel Change
                    </button>
                    <button
                        type="submit"
                    >
                        Change Tags
                    </button>
                </span>
            </form>
        </div>
        ,
        document.getElementById("portal")
    )
}

export default ChangeTagsModal