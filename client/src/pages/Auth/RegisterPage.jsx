import { useState } from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  AtSign,
  BriefcaseBusiness,
  LockKeyhole,
  Mail,
  UserRound
} from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import AuthAlert from "../../components/auth/AuthAlert";
import PasswordStrength from "../../components/auth/PasswordStrength";
import ProfilePhotoPicker from "../../components/auth/ProfilePhotoPicker";
import GoogleAuthButton from "../../components/auth/GoogleAuthButton";
import ButtonLoader
  from "../../components/common/AppStates/ButtonLoader";
import {
  UnwindCheckbox,
  UnwindDatePicker,
  UnwindSelect
} from "../../components/common/UnwindControls/UnwindControls";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../services/api";

import "./Auth.css";


/*
|--------------------------------------------------------------------------
| Initial Form Data
|--------------------------------------------------------------------------
*/

const initialFormData = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  dateOfBirth: "",
  gender: "",
  occupationType: ""
};


function RegisterPage() {
  const [
    formData,
    setFormData
  ] = useState(initialFormData);

  const [
    profileImage,
    setProfileImage
  ] = useState(null);

  const [
    profileImageError,
    setProfileImageError
  ] = useState("");

  const [
    acceptedTerms,
    setAcceptedTerms
  ] = useState(false);

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const {
    register
  } = useAuth();

  const navigate =
    useNavigate();


  /*
  |--------------------------------------------------------------------------
  | Update Form Field
  |--------------------------------------------------------------------------
  */

  const updateField = (
    event
  ) => {
    const {
      name,
      value
    } = event.target;

    setFormData(
      (currentData) => ({
        ...currentData,
        [name]: value
      })
    );
  };


  /*
  |--------------------------------------------------------------------------
  | Validate Registration Form
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    if (
      !formData.fullName.trim() ||
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.password
    ) {
      return "Complete all required fields.";
    }


    if (
      formData.username.includes(" ")
    ) {
      return "Username cannot contain spaces.";
    }


    if (
      formData.username.includes("@") ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.username
      )
    ) {
      return "Username cannot be an email address.";
    }


    if (
      formData.password.length < 8
    ) {
      return "Password must contain at least 8 characters.";
    }


    if (
      formData.password !==
      formData.confirmPassword
    ) {
      return "The passwords do not match.";
    }


    if (profileImageError) {
      return profileImageError;
    }


    if (!acceptedTerms) {
      return "You must accept the Terms and Privacy Policy.";
    }


    return null;
  };


  /*
  |--------------------------------------------------------------------------
  | Normal Email / Password Registration
  |--------------------------------------------------------------------------
  |
  | This remains completely separate from Google signup.
  |
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      return;
    }


    try {
      setLoading(true);


      const normalizedEmail =
        formData.email
          .trim()
          .toLowerCase();


      const response =
        await register({
          email:
            normalizedEmail,

          username:
            formData.username
              .trim(),

          password:
            formData.password,

          fullName:
            formData.fullName
              .trim(),

          dateOfBirth:
            formData.dateOfBirth ||
            null,

          gender:
            formData.gender ||
            null,

          occupationType:
            formData.occupationType ||
            null,

          profileImage
        });


      /*
      |--------------------------------------------------------------------------
      | Email Verification
      |--------------------------------------------------------------------------
      |
      | Normal registrations still require OTP verification.
      |
      | Google registrations DO NOT use this flow.
      |
      |--------------------------------------------------------------------------
      */

      navigate(
        "/verify-email",
        {
          replace: true,

          state: {
            email:
              normalizedEmail,

            password:
              formData.password,

            newRegistration:
              true,

            message:
              response?.data
                ?.warning ||
              response?.message ||
              ""
          }
        }
      );

    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to create your account."
        )
      );

    } finally {
      setLoading(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Page
  |--------------------------------------------------------------------------
  */

  return (
    <AuthLayout
      title="Create your space"
      description="Join a calmer community built around understanding and genuine connection."
    >

      <AuthAlert
        message={error}
      />


      {/* Google Signup */}

      <GoogleAuthButton
        mode="signup"
        disabled={loading}
      />


      {/* Divider */}

      <div className="auth-divider">
        <span>
          or
        </span>
      </div>


      {/* Normal Registration */}

     <form
  className="auth-form"
  onSubmit={handleSubmit}
  aria-busy={loading}
>

        <ProfilePhotoPicker
          file={profileImage}
          onChange={setProfileImage}
          error={profileImageError}
          onError={setProfileImageError}
        />


        {/* Full Name + Username */}

        <div className="auth-form__row">

          <AuthInput
            label="Full name"
            name="fullName"

            value={
              formData.fullName
            }

            onChange={
              updateField
            }

            placeholder="Your full name"

            autoComplete="name"

            icon={
              UserRound
            }

            required
          />


          <AuthInput
            label="Username"
            name="username"

            value={
              formData.username
            }

            onChange={
              updateField
            }

            placeholder="Choose a username"

            autoComplete="username"

            icon={
              AtSign
            }

            required
          />

        </div>


        {/* Email */}

        <AuthInput
          label="Email"
          name="email"
          type="email"

          value={
            formData.email
          }

          onChange={
            updateField
          }

          placeholder="you@example.com"

          autoComplete="email"

          icon={
            Mail
          }

          required
        />


        {/* Passwords */}

        <div className="auth-form__row">

          <AuthInput
            label="Password"
            name="password"
            type="password"

            value={
              formData.password
            }

            onChange={
              updateField
            }

            placeholder="Create a password"

            autoComplete="new-password"

            icon={
              LockKeyhole
            }

            required
          />


          <AuthInput
            label="Confirm password"
            name="confirmPassword"
            type="password"

            value={
              formData.confirmPassword
            }

            onChange={
              updateField
            }

            placeholder="Repeat your password"

            autoComplete="new-password"

            icon={
              LockKeyhole
            }

            required
          />

        </div>


        <PasswordStrength
          password={
            formData.password
          }
        />


        {/* DOB + Gender */}

        <div className="auth-form__row">

          <label className="auth-field">
  <span className="auth-field__label">
    Date of birth
  </span>

  <UnwindDatePicker
    name="dateOfBirth"
    value={formData.dateOfBirth}
    onChange={updateField}
    placeholder="Select date of birth"
    max={
      new Date()
        .toISOString()
        .slice(0, 10)
    }
  />
</label>


         <label className="auth-field">

  <span className="auth-field__label">
    Gender
  </span>

  <UnwindSelect
    name="gender"
    value={formData.gender}
    onChange={updateField}
    placeholder="Select gender"
    leadingIcon={
      <UserRound size={18} />
    }
  >
    <option value="">
      Prefer not to say
    </option>

    <option value="male">
      Male
    </option>

    <option value="female">
      Female
    </option>

    <option value="non_binary">
      Non-binary
    </option>

    <option value="other">
      Other
    </option>
  </UnwindSelect>

</label>
        </div>


        {/* Occupation */}

       <label className="auth-field">

  <span className="auth-field__label">
    Occupation
  </span>

  <UnwindSelect
    name="occupationType"
    value={formData.occupationType}
    onChange={updateField}
    placeholder="Select occupation"
    leadingIcon={
      <BriefcaseBusiness size={18} />
    }
  >
    <option value="">
      Select occupation
    </option>

    <option value="student">
      Student
    </option>

    <option value="employed">
      Employed
    </option>

    <option value="self_employed">
      Self-employed
    </option>

    <option value="unemployed">
      Currently not employed
    </option>

    <option value="other">
      Other
    </option>
  </UnwindSelect>

</label>


        {/* Terms */}

        <label className="register-terms">

        <UnwindCheckbox
  checked={acceptedTerms}
  onChange={(event) =>
    setAcceptedTerms(
      event.target.checked
    )
  }
/>

          <span>
            I have read and agree to the{" "}

            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontWeight: 700
              }}
            >
              Terms and Conditions
            </Link>

            {" "}and acknowledge the{" "}

            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontWeight: 700
              }}
            >
              Privacy Policy
            </Link>

            .
          </span>

        </label>


        {/* Submit */}

       <button
  type="submit"
  className="auth-submit-button"
  disabled={loading}
>
  {loading ? (
    <ButtonLoader
      label="Setting up your space…"
      size="small"
    />
  ) : (
    "Create my UNWIND account"
  )}
</button>

      </form>


      <p className="auth-switch-page">
        Already have an account?

        <Link to="/login">
          Sign in
        </Link>
      </p>

    </AuthLayout>
  );
}

export default RegisterPage;