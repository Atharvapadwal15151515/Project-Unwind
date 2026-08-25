import {
  useEffect,
  useRef,
  useState
} from "react";

import {
  AnimatePresence,
  motion
} from "framer-motion";

import {
  useNavigate
} from "react-router-dom";

import {
  ChevronDown,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound
} from "lucide-react";

import {
  useAuth
} from "../../context/AuthContext";


/*
|--------------------------------------------------------------------------
| User Display Name
|--------------------------------------------------------------------------
*/

function getUserDisplayName(user) {
  return (
    user?.full_name ||
    user?.fullName ||
    user?.username ||
    "UNWIND Member"
  );
}


/*
|--------------------------------------------------------------------------
| Profile Image URL
|--------------------------------------------------------------------------
*/

function getProfileImageUrl(user) {
  return (
    user?.profile_image_url ||
    user?.profileImageUrl ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| User Avatar
|--------------------------------------------------------------------------
|
| Valid profile image:
| → Show image
|
| No profile image:
| → Show silhouette
|
| Broken image:
| → Show silhouette
|
|--------------------------------------------------------------------------
*/

function UserAvatar({
  user,
  large = false
}) {
  const profileImageUrl =
    getProfileImageUrl(user);

  const [
    imageFailed,
    setImageFailed
  ] = useState(false);


  /*
  | Reset image error whenever
  | profile image changes.
  */

  useEffect(() => {
    setImageFailed(false);
  }, [profileImageUrl]);


  const showImage =
    Boolean(profileImageUrl) &&
    !imageFailed;


  return (
    <span
      className={
        large
          ? "dashboard-user-menu__avatar dashboard-user-menu__avatar--large"
          : "dashboard-user-menu__avatar"
      }
    >
      {showImage ? (
        <img
          src={profileImageUrl}
          alt=""
          onError={() =>
            setImageFailed(true)
          }
        />
      ) : (
        <UserRound
          className="dashboard-user-menu__avatar-placeholder"
          size={large ? 24 : 20}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      )}
    </span>
  );
}


/*
|--------------------------------------------------------------------------
| User Menu
|--------------------------------------------------------------------------
*/

function UserMenu() {
  const [
    open,
    setOpen
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut
  ] = useState(false);


  const {
    user,
    logout
  } = useAuth();


  const menuRef =
    useRef(null);

  const navigate =
    useNavigate();


  /*
  |--------------------------------------------------------------------------
  | Close Menu
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target
        )
      ) {
        setOpen(false);
      }
    };


    const handleEscape = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        setOpen(false);
      }
    };


    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );


    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);


  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const handleNavigation = (
    path
  ) => {
    setOpen(false);

    navigate(path);
  };


  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout =
    async () => {
      try {
        setLoggingOut(true);

        await logout();

        navigate(
          "/login",
          {
            replace: true
          }
        );
      } finally {
        setLoggingOut(false);
        setOpen(false);
      }
    };


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="dashboard-user-menu"
      ref={menuRef}
    >

      {/* User Menu Trigger */}

      <motion.button
        type="button"

        className="dashboard-user-menu__trigger"

        onClick={() =>
          setOpen(
            (currentValue) =>
              !currentValue
          )
        }

        whileTap={{
          scale: 0.97
        }}

        aria-expanded={open}
        aria-haspopup="menu"
      >

        <UserAvatar
          user={user}
        />


        <span className="dashboard-user-menu__identity">

          <strong>
            {getUserDisplayName(user)}
          </strong>

          <small>
            {user?.email ||
              "UNWIND member"}
          </small>

        </span>


        <motion.span
          animate={{
            rotate:
              open
                ? 180
                : 0
          }}

          transition={{
            duration: 0.2
          }}
        >
          <ChevronDown
            size={16}
          />
        </motion.span>

      </motion.button>


      {/* Dropdown */}

      <AnimatePresence>
        {open && (
          <motion.div
            className="dashboard-user-menu__dropdown"

            role="menu"

            initial={{
              opacity: 0,
              y: -8,
              scale: 0.96
            }}

            animate={{
              opacity: 1,
              y: 0,
              scale: 1
            }}

            exit={{
              opacity: 0,
              y: -5,
              scale: 0.97
            }}

            transition={{
              duration: 0.2
            }}
          >

            {/* User Summary */}

            <div className="dashboard-user-menu__summary">

              <UserAvatar
                user={user}
                large
              />


              <div>

                <strong>
                  {getUserDisplayName(user)}
                </strong>

                <small>
                  {user?.username
                    ? `@${user.username}`
                    : user?.email}
                </small>

              </div>

            </div>


            <div className="dashboard-user-menu__divider" />


            {/* Profile */}

            <button
              type="button"

              onClick={() =>
                handleNavigation(
                  "/dashboard/profile"
                )
              }
            >
              <UserRound size={17} />

              My profile
            </button>


            {/* Settings */}

            <button
              type="button"

              onClick={() =>
                handleNavigation(
                  "/dashboard/settings"
                )
              }
            >
              <Settings size={17} />

              Settings
            </button>


            {/* Security */}

            <button
              type="button"

              onClick={() =>
                handleNavigation(
                  "/dashboard/settings/security"
                )
              }
            >
              <ShieldCheck size={17} />

              Security
            </button>


            <div className="dashboard-user-menu__divider" />


            {/* Logout */}

            <button
              type="button"

              className="dashboard-user-menu__logout"

              onClick={
                handleLogout
              }

              disabled={
                loggingOut
              }
            >
              <LogOut size={17} />

              {loggingOut
                ? "Signing out…"
                : "Sign out"}
            </button>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}


export default UserMenu;