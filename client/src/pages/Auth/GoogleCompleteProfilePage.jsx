import {
  useEffect,
  useState
} from "react";

import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  AtSign,
  BriefcaseBusiness,
  CalendarDays,
  UserRound
} from "lucide-react";

import AuthLayout from "../../components/auth/AuthLayout";
import AuthInput from "../../components/auth/AuthInput";
import AuthAlert from "../../components/auth/AuthAlert";
import ProfilePhotoPicker from "../../components/auth/ProfilePhotoPicker";
import {
  UnwindCheckbox,
  UnwindDatePicker,
  UnwindSelect
} from "../../components/common/UnwindControls/UnwindControls";
import {
  completeGoogleProfile,
  getGoogleSignupToken,
  cleanGoogleAuthUrl
} from "../../services/googleAuthService";

import {
  useAuth
} from "../../context/AuthContext";

import "./Auth.css";


const initialFormData = {
  username: "",
  dateOfBirth: "",
  gender: "",
  occupationType: ""
};


function GoogleCompleteProfilePage() {
  const navigate =
    useNavigate();

  const {
    refreshUser
  } = useAuth();


  /*
  |--------------------------------------------------------------------------
  | Google Signup Token
  |--------------------------------------------------------------------------
  */

  const [
    googleSignupToken
  ] = useState(() =>
    getGoogleSignupToken()
  );


  /*
  |--------------------------------------------------------------------------
  | Form State
  |--------------------------------------------------------------------------
  */

  const [
    formData,
    setFormData
  ] = useState(
    initialFormData
  );


  /*
  |--------------------------------------------------------------------------
  | Profile Image
  |--------------------------------------------------------------------------
  |
  | Optional.
  |
  | If user does not select an image,
  | ProfilePhotoPicker should display
  | the default silhouette.
  |
  |--------------------------------------------------------------------------
  */

  const [
    profileImage,
    setProfileImage
  ] = useState(null);

  const [
    profileImageError,
    setProfileImageError
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Terms
  |--------------------------------------------------------------------------
  */

  const [
    acceptedTerms,
    setAcceptedTerms
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | UI State
  |--------------------------------------------------------------------------
  */

  const [
    error,
    setError
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | Validate Google Signup Session
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!googleSignupToken) {
      navigate(
        "/login",
        {
          replace: true
        }
      );

      return;
    }


    /*
    | Remove temporary token
    | from visible browser URL.
    */

    cleanGoogleAuthUrl();

  }, [
    googleSignupToken,
    navigate
  ]);


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

        [name]:
          value
      })
    );


    if (error) {
      setError("");
    }
  };


  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  const validateForm = () => {
    const username =
      formData.username.trim();


    if (!username) {
      return "Please choose a username.";
    }


    if (
      username.length < 3
    ) {
      return "Username must contain at least 3 characters.";
    }


    if (
      username.length > 30
    ) {
      return "Username cannot exceed 30 characters.";
    }


    if (
      username.includes(" ")
    ) {
      return "Username cannot contain spaces.";
    }


    if (
      username.includes("@") ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        username
      )
    ) {
      return "Username cannot be an email address.";
    }


    if (
      !formData.dateOfBirth
    ) {
      return "Please enter your date of birth.";
    }


    if (!formData.gender) {
      return "Please select your gender.";
    }


    if (
      !formData.occupationType
    ) {
      return "Please select your occupation.";
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
  | Submit Google Signup
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();


    if (loading) {
      return;
    }


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


      await completeGoogleProfile({
        googleSignupToken,

        username:
          formData.username.trim(),

        dateOfBirth:
          formData.dateOfBirth,

        gender:
          formData.gender,

        occupationType:
          formData.occupationType,

        profileImage
      });


      /*
      |--------------------------------------------------------------------------
      | Enter Existing UNWIND Authentication Flow
      |--------------------------------------------------------------------------
      |
      | Backend creates the session and sets
      | the HttpOnly refresh-token cookie.
      |
      |--------------------------------------------------------------------------
      */

      await refreshUser();


      navigate(
        "/dashboard",
        {
          replace: true
        }
      );

    } catch (requestError) {
      console.error(
        "Google signup failed:",
        requestError
      );


      setError(
        requestError?.message ||
        "Unable to complete Google signup."
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
      title="Complete your profile"
      description="Just a few more details before you start using UNWIND."
    >

      <AuthAlert
        message={error}
      />


      <form
        className="auth-form"
        onSubmit={handleSubmit}
      >

        {/* Profile Photo */}

        <ProfilePhotoPicker
          file={profileImage}
          onChange={setProfileImage}
          error={profileImageError}
          onError={setProfileImageError}
        />


        {/* Username + DOB */}

        <div className="auth-form__row">

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
  required
/>
</label>

        </div>


        {/* Gender */}

        <label className="auth-field">

          <span className="auth-field__label">
            Gender
          </span>

         <UnwindSelect
  name="gender"
  value={formData.gender}
  onChange={updateField}
  placeholder="Select gender"
  icon={UserRound}
  required
>
  <option value="">
    Select gender
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

  <option value="prefer_not_to_say">
    Prefer not to say
  </option>
</UnwindSelect>

        </label>


        {/* Occupation */}

        <label className="auth-field">

          <span className="auth-field__label">
            Occupation
          </span>

<label className="auth-field">
  <span className="auth-field__label">
    Occupation
  </span>

  <UnwindSelect
    name="occupationType"
    value={formData.occupationType}
    onChange={updateField}
    placeholder="Select occupation"
    icon={BriefcaseBusiness}
    required
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

        </label>


        {/* Terms & Privacy */}

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

          disabled={
            loading
          }
        >
          {loading ? (
            <>
              <span className="auth-button-spinner" />

              Creating your account…
            </>
          ) : (
            "Continue to UNWIND"
          )}
        </button>

      </form>


      <p className="auth-switch-page">
        Want to use another account?

        <Link to="/login">
          Back to sign in
        </Link>
      </p>

    </AuthLayout>
  );
}


export default GoogleCompleteProfilePage;