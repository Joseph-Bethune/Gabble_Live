import React from 'react';
import { useState, useEffect } from 'react';
import './LeafContextMenu.css';

const LeafContextMenu = (props) => {
    //#region expected props
    /*
    data.positionX float
    data.positionY float
    data.isOpen boolean
    data.targetPost post
    data.ownPost boolean
    closeMenu function()
    changeTags function()
        
    //*/
    //#endregion

    //#region useEffect for post data

    useEffect(() => {
        //console.log(props.data);
    }, [props.data])

    //#endregion

    //#region style

    const getStyle = () => {
        let output = {

        }
        if (props.data.isOpen) {
            output = {
                ...output,
                left: props.data.positionX ? props.data.positionX : 0,
                top: props.data.positionY ? props.data.positionY : 0,
            }
        } else {
            output.display = 'none';
        }
        return output;
    }

    //#endregion

    //#region delegates

    const changeTagsHandler = (e) => {
        e.stopPropagation();
        if (props.changeTags) props.changeTags(props.data.targetPost);
        if (props.closeMenu) props.closeMenu();
    }

    //#endregion

    //#region generate buttons

    const generateButtons = () => {
        if (props.data.isOwnPost) {
            return (
                <div
                    className="clickableElement"
                    onClick={changeTagsHandler}
                >
                    Change Tags
                </div>
            )
        } else {
            return <></>
        }
    }

    //#endregion

    return (
        <div className="messagePostContextRootDiv" style={getStyle()}>
            {generateButtons()}
        </div>
    )
}

export default LeafContextMenu