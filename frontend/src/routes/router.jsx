import { BrowserRouter, createBrowserRouter, Routes, Route } from 'react-router-dom'
import Register from '../userAuth/Register/Register.jsx'
import Login from '../userAuth/Login/Login.jsx';
import Logout from '../userAuth/Logout/Logout.jsx';
import Profile from '../userAuth/Profile/Profile.jsx';
import Conversation from '../conversation/ConversationPage/Conversation.jsx';
import MessageSearchPage from '../conversation/MessageSearch/MessageSearch.jsx';

const router = createBrowserRouter([
    { path: "/", element: <MessageSearchPage /> },
    { path: "/convo/:postId", element: <Conversation />},
    { path: "/convo/", element: <Conversation />},
    { path: "/user", element: <Profile /> },
    { path: "/user/login", element: <Login /> },
    { path: "/user/register", element: <Register /> },
    { path: "/user/logout", element: <Logout /> },
]);

export default router;