import '@fortawesome/fontawesome-free/css/all.min.css';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import React, { useState } from "react";
import { toast } from "react-toastify";
import { auth } from "../../lib/firebase"; // Make sure to import auth from the correct file
function SignInForm() {
  const [state, setState] = React.useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false); // Add loading state
  const handleChange = evt => {
    const value = evt.target.value;
    setState({
      ...state,
      [evt.target.name]: value
    });
  };

  const handleGoogle = async (e) => {
    const provider = await new GoogleAuthProvider();
    return signInWithPopup(auth, provider);

  }

  const handleOnSubmit = async (e) => {

    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      await signInWithEmailAndPassword(auth, email, password)
    }
    catch (err) {
      console.log(err)
      toast.error("Double Check Your Coordinnates!")
    }
    finally {
      setLoading(false)
    }
  };


  return (
    <div className="form-container sign-in-container">
      <form onSubmit={handleOnSubmit}>
        <h1 style={{ color: 'black' }}>Sign in</h1>
        <div className="social-container">
          <a href="#" className="social"   >
            <i className="fab fa-facebook-f" />
          </a>
          <a href="#" className="social" onClick={handleGoogle} >
            <i className="fab fa-google" />
          </a>
          <a href="#" className="social">
            <i className="fab fa-apple" />
          </a>
        </div>
        <span style={{ color: 'black' }}>or use your account</span>
        <input
          type="email"
          placeholder="Email"
          name="email"
          id="email"
          value={state.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={state.password}
          onChange={handleChange}
        />
        <a href="#">Forgot your password?</a>
        <button>Sign In</button>
      </form>
    </div>
  );
};


export default SignInForm;
