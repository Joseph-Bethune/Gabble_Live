import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import {
    thunkStatuses,
    registerNewUserThunk, getRegistrationThunkStatus, resetRegistrationThunkStatus, getRegistrationThunkStatusError
} from '../userAuthSlice';
import { Link, useNavigate } from 'react-router-dom';
import NavButton from '../../navButton/NavButton';
import "../styles/userAuth.css";
import "./Register.css";

const PWD_REGEX = {
    length: /^.{8,24}$/,
    inclusiveTests: {
        lowercaseLetter: /(?=.*[a-z])/,
        uppercaseLetter: /(?=.*[A-Z])/,
        number: /(?=.*[\d])/,
        specialCharacter: /(?=.*[!@#$%])/
    },
    exclusiveTest: /[^a-zA-Z0-9!@#$%]/, // needs to be inverted
    all: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/,
}
const USERNAME_REGEX = {
    startsWithLetter: /^[a-zA-Z]/,
    length: /^.{4,23}$/,
    content: /^[a-zA-Z0-9-_]+$/,
    all: /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/
};

const Register = () => {

    const userRef = useRef();
    const errRef = useRef();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [userFocus, setUserFocus] = useState(false);

    const [pwd, setPwd] = useState('');
    const [pwdFocus, setPwdFocus] = useState(false);

    const [matchPwd, setMatchPwd] = useState('');
    const [validMatch, setValidMatch] = useState(false);
    const [matchFocus, setMatchFocus] = useState(false);
    const [confirmPwdErrMsg, setConfirmPwdErrMsg] = useState('Invalid Password');

    const [errMsg, setErrMsg] = useState('');

    useEffect(() => {
        userRef.current.focus();
    }, []);

    useEffect(() => {
        setErrMsg('');
    }, [username, pwd, matchPwd]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const v1 = USERNAME_REGEX.all.test(username);
        const v2 = PWD_REGEX.all.test(pwd);
        const v3 = pwd === matchPwd;
        if (!v1 || !v2 || !v3) {
            setErrMsg("Invalid Entry");
            return;
        }
        dispatch(registerNewUserThunk({ username: username, password: pwd, displayName: username }));
    }

    //#region username validity test

    const [validName, setValidName] = useState({ length: false, startingCharacter: false, content: false, all: false });

    useEffect(() => {
        // checks if the user name passes the regex tests      

        const length = USERNAME_REGEX.length.test(username);
        const startsWithLetter = USERNAME_REGEX.startsWithLetter.test(username);
        const content = USERNAME_REGEX.content.test(username);        

        const newValue = {
            length: length,
            startingCharacter: startsWithLetter,
            content: content,
            all: (length && startsWithLetter && content)
        };

        setValidName(newValue);
    }, [username]);

    //#endregion

    //#region showpassword flags

    const [showPwd, setShowPwd] = useState(false);
    const [showPwdMatch, setShowPwdMatch] = useState(false);

    //#endregion

    //#region password validity test

    const [validPwd, setValidPwd] = useState({
        length: false,
        inclusiveTests: {
            lowercaseLetter: false,
            uppercaseLetter: false,
            number: false,
            specialCharacter: false,
            root: false
        },
        exclusiveTest: false,
        all: false
    });

    useEffect(() => {

        const length = PWD_REGEX.length.test(pwd);

        const exclusiveTest = !PWD_REGEX.exclusiveTest.test(pwd);

        const lowercaseLetter = PWD_REGEX.inclusiveTests.lowercaseLetter.test(pwd);
        const uppercaseLetter = PWD_REGEX.inclusiveTests.uppercaseLetter.test(pwd);
        const number = PWD_REGEX.inclusiveTests.number.test(pwd);
        const specialCharacter = PWD_REGEX.inclusiveTests.specialCharacter.test(pwd);
        const inclusiveTestRoot = (lowercaseLetter && uppercaseLetter && number && specialCharacter);

        const newValue = {
            length: length,
            inclusiveTests: {
                lowercaseLetter,
                uppercaseLetter,
                number,
                specialCharacter,
                root: inclusiveTestRoot
            },
            exclusiveTest: exclusiveTest,
            all: (length && inclusiveTestRoot && exclusiveTest)
        }

        setValidPwd(newValue);

        // checks if the passwords match
        const pwdMatch = pwd === matchPwd;
        setValidMatch(pwdMatch);

        if (validPwd.all && pwdMatch) {
            setConfirmPwdErrMsg('Good');
        }
        else if (!pwdMatch) {
            setConfirmPwdErrMsg("Passwords don't match.");
        }
        else {
            setConfirmPwdErrMsg("Invalid password.");
        }
    }, [pwd, matchPwd]);

    //#endregion

    //#region registration thunk status and error message

    const [errorText, setErrorText] = useState(null);
    const [errorClasses, setErrorClasses] = useState("hidden");
    const registrationThunkStatus = useSelector(getRegistrationThunkStatus);
    const registrationErrorMessage = useSelector(getRegistrationThunkStatusError);

    useEffect(() => {
        // triggers when the registration status changes
        if (registrationThunkStatus === thunkStatuses.fulfilled) {
            dispatch(resetRegistrationThunkStatus());
            setErrorClasses("hidden");
            setErrorText(null);
            navigate("/user/login", { state: { username: username } });
        } else if (registrationThunkStatus == thunkStatuses.rejected) {
            if (registrationErrorMessage != null) {
                setErrorClasses("errorMessage");
                setErrorText(registrationErrorMessage);
                dispatch(resetRegistrationThunkStatus());
            }
        }
    }, [registrationThunkStatus])

    //#endregion

    //#region nav bar links

    const getLinks = () => {
        return [
            { text: "Search", dest: "/" }
        ]
    }

    //#endregion

    return (
        <div>
            <div className="topBar">
                <NavButton links={getLinks()} showLogin={true} />
            </div>
            <div className='centerDiv rootDiv'>
                <title>New User Registration</title>
                <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
                <h1>Register</h1>
                <div className={errorClasses} style={{ marginBottom: '1rem' }}>
                    {errorText}
                </div>
                <form className='verticalForm authForm regForm' onSubmit={handleSubmit}>
                    <div id="username" className='flex-column'>
                        <label htmlFor="username">Username :
                            {validName.all ? (<span className="valid">Good</span>) : (<span className="invalid">Invalid Username</span>)}
                        </label>
                        <input
                            type="text"
                            id="username"
                            ref={userRef}
                            autoComplete="off"
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            aria-invalid={validName ? "false" : "true"}
                            aria-describedby='uidnote'
                            onFocus={() => setUserFocus(true)}
                            onBlur={() => setUserFocus(false)}
                        />
                        <div id="uidnote" className={userFocus && !validName.all ? "instructions" : "offscreen"}>
                            <div className={validName.length ? 'valid' : 'invalid'}>
                                4 to 24 characters.
                            </div>
                            <div className={validName.startingCharacter ? 'valid' : 'invalid'}>
                                Must begin with a letter.
                            </div>
                            <div className={validName.content ? 'valid' : 'invalid'}>
                                Letters, numbers, underscores, hyphens allowed.
                            </div>
                        </div>
                    </div>
                    <div id="password" className='flex-column'>
                        <div className='flex-row'>
                            <label htmlFor="password">Password :
                                {validPwd.all ? <span className="valid">Good</span> : <span className="invalid">Invalid Password</span>}
                            </label>
                        </div>
                        <div className='flex-row'>
                            <input
                                type={showPwd ? "text" : "password"}
                                id="password"
                                onChange={(e) => setPwd(e.target.value)}
                                required
                                aria-invalid={validPwd.all ? "false" : "true"}
                                aria-describedby="pwdnote"
                                onFocus={() => setPwdFocus(true)}
                                onBlur={() => setPwdFocus(false)}
                            />
                            <input
                                type="checkbox"
                                className="checkBox"
                                checked={showPwd}
                                onChange={(e) => { setShowPwd(e.target.checked) }}
                            /> : Show Password
                        </div>
                        <div id="pwdnote" className={pwdFocus && !validPwd.all ? "instructions" : "offscreen"}>
                            <div>
                                <span className={validPwd.inclusiveTests.root ? 'valid' : 'invalid'}>Must include at least one of each:</span>
                                <br /><span className={validPwd.inclusiveTests.lowercaseLetter ? 'valid' : 'invalid'}>lowercase letter,</span>
                                <br /><span className={validPwd.inclusiveTests.uppercaseLetter ? 'valid' : 'invalid'}>uppercase letter,</span>
                                <br /><span className={validPwd.inclusiveTests.number ? 'valid' : 'invalid'}>number,</span>
                                <br /><span className={validPwd.inclusiveTests.specialCharacter ? 'valid' : 'invalid'}>allowed special character (! @ # $ %).</span>
                            </div>
                            <div className={validPwd.exclusiveTest ? 'valid' : 'invalid'}>
                                Cannot include any characters not listed above.
                            </div>
                            <div className={validPwd.length ? 'valid' : 'invalid'}>
                                8 to 24 characters.
                            </div>
                        </div>
                    </div>
                    <div id="passwordMatch" className='flex-column'>
                        <div className='flex-row'>
                            <label htmlFor="confirm_password">Password Confirmation :
                                <span className={confirmPwdErrMsg === 'Good' ? "valid" : "invalid"}>{confirmPwdErrMsg}</span>
                            </label>
                        </div>
                        <div className='flex-row'>
                            <input
                                type={showPwdMatch ? "text" : "password"}
                                id="confirm_password"
                                onChange={(e) => setMatchPwd(e.target.value)}
                                required
                                aria-invalid={validPwd.all ? "false" : "true"}
                                aria-describedby="confirmnote"
                                onFocus={() => setMatchFocus(true)}
                                onBlur={() => setMatchFocus(false)}
                            />
                            <input
                                type="checkbox"
                                className="checkBox"
                                checked={showPwdMatch}
                                onChange={(e) => { setShowPwdMatch(e.target.checked) }}
                            /> : Show Password
                        </div>

                        <div id="confirmnote" className={matchFocus && !validMatch ? "instructions" : "offscreen"}>
                            <span className={validMatch ? 'valid' : 'invalid'}>Must match the first password input field.</span>
                        </div>
                    </div>
                    <button disabled={!validName || !validPwd.all || !validMatch ? true : false}>
                        Sign Up
                    </button>
                </form>
                <p>
                    Already registered?<br />
                    <Link to="/user/login">Sign In</Link>
                </p>
            </div>
        </div>
    )
}

export default Register;