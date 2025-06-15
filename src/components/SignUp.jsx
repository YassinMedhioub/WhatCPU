import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { auth, db } from "../lib/firebase";

function SignUpForm() {
  const [state, setState] = React.useState({
    username: "", // Changed from name to username
    email: "",
    password: ""
  });
  const [error, setError] = useState(false);
  const [googleErrorMessage, setGoogleErrorMessage] = useState("");
  const handleChange = (evt) => {
    const value = evt.target.value;
    setState({
      ...state,
      [evt.target.name]: value
    });
  };
  const handleGoogleSignUp = async (e) => {
    e.preventDefault();

    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);

      const user = result.user;
      console.log(user.displayName);
      await setDoc(doc(db, "users", res.user.uid), {
        username: user.displayName,
        email: user.email,
        id: result.uid,
        blocked: [],
        friends: [],
      });
      await setDoc(doc(db, "userchats", res.user.uid), {
        username: user.displayName,
        email: user.email,
        id: result.uid,
        blocked: [],
        friends: [],
      });
      toast.success("Welcome CPUer, Enjoy the Experience");
    } catch (err) {
      const errorMessage = err.message;
      const errorCode = err.code;

      setError(true);

      switch (errorCode) {
        case "auth/operation-not-allowed":
          setGoogleErrorMessage("Email/password accounts are not enabled.");
          break;
        case "auth/operation-not-supported-in-this-environment":
          setGoogleErrorMessage("HTTP protocol is not supported. Please use HTTPS.")
          break;
        case "auth/popup-blocked":
          setGoogleErrorMessage("Popup has been blocked by the browser. Please allow popups for this website.")
          break;
        case "auth/popup-closed-by-user":
          setGoogleErrorMessage("Popup has been closed by the user before finalizing the operation. Please try again.")
          break;
        default:
          setGoogleErrorMessage(errorMessage);
          break;
      }
    }
  };



  const handleAvatar = () => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0])
      })
    }
  }

  const handleOnSubmit = async (e) => {
    e.preventDefault();

    const { username, email, password } = state; // Use username

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", res.user.uid), {
        username, // Use username here
        email,
        id: res.user.uid,
        blocked: [],
        friends: [],
      });
      await setDoc(doc(db, "userchats", res.user.uid), {
        username, // Use username here
        email,
        id: res.user.uid,
        blocked: [],
        friends: [],
      });
      toast.success("Welcome CPUer, Enjoy the Experience");
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    }
  };

  return (
    <div className="form-container sign-up-container">
      <form onSubmit={handleOnSubmit}>
        <h1 style={{ color: 'black' }}>Create Account</h1>
        <div className="social-container">
          <a href="#" className="social">
            <i className="fab fa-facebook-f" />
          </a>
          <a href="#" className="social" onClick={handleGoogleSignUp}>
            <i className="fab fa-google" />
          </a>
          <a href="#" className="social">
            <i className="fab fa-apple" />
          </a>
        </div>
        <span style={{ color: 'black' }}>or use your email for registration</span>
        <input
          type="text"
          name="username" // Use username
          value={state.username} // Use username
          onChange={handleChange}
          placeholder="Username"
        />
        <input
          type="email"
          name="email"
          value={state.email}
          onChange={handleChange}
          placeholder="Email"
        />
        <input
          type="password"
          name="password"
          value={state.password}
          onChange={handleChange}
          placeholder="Password"
        />
        <button>Sign Up</button>
      </form>
    </div>
  );
}

export default SignUpForm;
