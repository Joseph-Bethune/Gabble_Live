import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import { registerNewUserThunk, getRegistrationThunkStatus, thunkStatuses, resetRegistrationThunkStatus } from '../userAuthSlice';
import { Link, useNavigate } from 'react-router-dom';
import NavButton from '../../navButton/NavButton';
import "../styles/userAuth.css";
import "./Register.css";

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

const Register = () => {

    const userRef = useRef();
    const errRef = useRef();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [validName, setValidName] = useState(false);
    const [userFocus, setUserFocus] = useState(false);

    const [pwd, setPwd] = useState('');
    const [validPwd, setValidPwd] = useState(false);
    const [pwdFocus, setPwdFocus] = useState(false);

    const [matchPwd, setMatchPwd] = useState('');
    const [validMatch, setValidMatch] = useState(false);
    const [matchFocus, setMatchFocus] = useState(false);
    const [confirmPwdErrMsg, setConfirmPwdErrMsg] = useState('Invalid Password');

    const [errMsg, setErrMsg] = useState('');
    const [success, setSuccess] = useState(false);

    const registrationThunkStatus = useSelector(getRegistrationThunkStatus);

    useEffect(() => {
        //userRef.current.focus();
    }, []);

    useEffect(() => {
        // checks if the user name passes the regex test
        const result = USERNAME_REGEX.test(username);
        setValidName(result);
    }, [username]);

    useEffect(() => {
        // checks if the password passes the regex test
        const validPwd = PWD_REGEX.test(pwd);
        setValidPwd(validPwd);

        // checks if the passwords match
        const pwdMatch = pwd === matchPwd;
        setValidMatch(pwdMatch);

        if (validPwd && pwdMatch) {
            setConfirmPwdErrMsg('Good');
        }
        else if (!pwdMatch) {
            setConfirmPwdErrMsg("Passwords don't match.");
        }
        else {
            setConfirmPwdErrMsg("Invalid password.");
        }
    }, [pwd, matchPwd]);

    useEffect(() => {
        setErrMsg('');
    }, [username, pwd, matchPwd]);

    useEffect(() => {
        // triggers when the registration status changes
        if (registrationThunkStatus === thunkStatuses.fulfilled) {
            dispatch(resetRegistrationThunkStatus());
            navigate("/user/login", { state: { username: username } });
        }
    }, [registrationThunkStatus])

    const handleSubmit = async (e) => {
        e.preventDefault();
        const v1 = USERNAME_REGEX.test(username);
        const v2 = PWD_REGEX.test(pwd);
        const v3 = pwd === matchPwd;
        if (!v1 || !v2 || !v3) {
            setErrMsg("Invalid Entry");
            return;
        }
        dispatch(registerNewUserThunk({ username: username, password: pwd }));
    }

    const getLinks = () => {
        return [
            { text: "Search", dest: "/" }
        ]
    }

    return (
        <div>
            <div className="topBar">
                <NavButton links={getLinks()} />
            </div>
            <div className='centerDiv rootDiv'>
                <title>New User Registration</title>
                <p ref={errRef} className={errMsg ? "errmsg" : "offscreen"} aria-live="assertive">{errMsg}</p>
                <h1>Register</h1>
                <form className='verticalForm' onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="username">Username :
                            {validName ? (<span className="valid">Good</span>) : (<span className="invalid">Invalid Username</span>)}
                        </label>
                        <br />
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
                        <p id="uidnote" className={userFocus && !validName ? "instructions" : "offscreen"}>
                            4 to 24 characters. <br />
                            Must begin with a letter.<br />
                            Letters, numbers, underscores, hyphens allowed.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="password">Password :
                            {validPwd ? <span className="valid">Good</span> : <span className="invalid">Invalid Password</span>}
                        </label>
                        <br />
                        <input
                            type="password"
                            id="password"
                            onChange={(e) => setPwd(e.target.value)}
                            required
                            aria-invalid={validPwd ? "false" : "true"}
                            aria-describedby="pwdnote"
                            onFocus={() => setPwdFocus(true)}
                            onBlur={() => setPwdFocus(false)}
                        />
                        <p id="pwdnote" className={pwdFocus && !validPwd ? "instructions" : "offscreen"}>
                            8 to 24 characters. <br />
                            Must include uppercase and lowercase letters, a number and a special character.<br />
                            Allowed special characters: ! @ # $ %.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="confirm_password">Password Confirmation :
                            <span className={confirmPwdErrMsg === 'Good' ? "valid" : "invalid"}>{confirmPwdErrMsg}</span>
                        </label>
                        <br />
                        <input
                            type="password"
                            id="confirm_password"
                            onChange={(e) => setMatchPwd(e.target.value)}
                            required
                            aria-invalid={validPwd ? "false" : "true"}
                            aria-describedby="confirmnote"
                            onFocus={() => setMatchFocus(true)}
                            onBlur={() => setMatchFocus(false)}
                        />
                        <p id="confirmnote" className={matchFocus && !validMatch ? "instructions" : "offscreen"}>
                            Must match the first password input field.
                        </p>
                    </div>

                    <button disabled={!validName || !validPwd || !validMatch ? true : false}>
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