import {
  useState
} from "react";

import {
  Navigate,
  Route,
  Routes
} from "react-router-dom";

import UnwindIntro
  from "./components/intro/UnwindIntro.jsx";

  
import GoogleAuthSuccessPage
  from "./pages/Auth/GoogleAuthSuccessPage.jsx";

import GoogleCompleteProfilePage
  from "./pages/Auth/GoogleCompleteProfilePage.jsx";

import GoogleAuthErrorPage
  from "./pages/Auth/GoogleAuthErrorPage.jsx";
/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import VerifyEmailPage from "./pages/Auth/VerifyEmailPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/Auth/ResetPasswordLinkPage";

/*
|--------------------------------------------------------------------------
| Public pages
|--------------------------------------------------------------------------
*/

import LandingPage from "./pages/Landing/LandingPage";

/*
|--------------------------------------------------------------------------
| Dashboard layout and protection
|--------------------------------------------------------------------------
*/
import AdminLayout
  from "./layouts/AdminLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

/*
|--------------------------------------------------------------------------
| Existing dashboard pages
|--------------------------------------------------------------------------
*/

import DashboardHomePage from "./pages/Dashboard/DashboardHome";
import CommunityPage from "./pages/Community/CommunityPage";
import Profile from "./pages/Dashboard/Profile";
import Setting from "./pages/Dashboard/Setting";
import SafetyReportsPage
  from "./pages/Reports/SafetyReportsPage";

/*
|--------------------------------------------------------------------------
| Reusable placeholder
|--------------------------------------------------------------------------
*/

import DashboardPlaceholderPage from "./pages/Dashboard/DashboardPlaceHolderPage";

import TrackersPage from "./pages/Trackers/TrackersPage";

import DassPage from "./pages/Dass/DassPage";

import AICompanionPage from "./pages/AICompanion/AICompanionPage";

import PrivateRoomsPage from "./pages/Messages/PrivateRoomsPage";

import TermsPage from "./pages/Terms/TermsPage";

import PrivacyPage from "./pages/Privacy/PrivacyPage";

import PublicInfoPage from "./pages/PublicInfo/PublicInfoPage.jsx";

import MessagesPage from "./pages/Messages/MessagesPage";

import CommunityChatPage from "./pages/Messages/CommunityChatPage";

import JournalPage from "./pages/Journal/JournalPage";

import NotificationsPage from "./pages/Notifications/NotificationsPage";

import WellnessToolkit
  from "./pages/WellnessToolkit/WellnessToolkit";

  import BreathingPage
  from "./pages/WellnessToolkit/breathing/BreathingPage.jsx";

  import GroundingPage
  from "./pages/WellnessToolkit/grounding/GroundingPage.jsx";

  import EmotionalCheckin
  from "./pages/WellnessToolkit/emotional/EmotionalCheckin.jsx";

  import ThoughtDump
  from "./pages/WellnessToolkit/thoughts/ThoughtDump.jsx";

  import FocusPage
  from "./pages/WellnessToolkit/focus/FocusPage.jsx";

  import CalmSounds
  from "./pages/WellnessToolkit/sounds/CalmSounds.jsx";

  import Gratitude
  from "./pages/WellnessToolkit/gratitude/Gratitude.jsx";

  import WellnessHistory
  from "./pages/WellnessToolkit/history/WellnessHistory.jsx";

  import SavedTools
  from "./pages/WellnessToolkit/saved/SavedTools.jsx";

  import RecentTools
  from "./pages/WellnessToolkit/recent/RecentTools.jsx";

  import MovementBreak
  from "./pages/WellnessToolkit/movement/MovementBreak.jsx";

  import BodyScan
  from "./pages/WellnessToolkit/bodyscan/BodyScan.jsx";


  
/*
|--------------------------------------------------------------------------
| Admin pages
|--------------------------------------------------------------------------
*/

import AdminDashboardPage
  from "./pages/admin/adminDashboardPage";

import AdminUsersPage
  from "./pages/admin/adminUsersPage";

import AdminUserDetailsPage
  from "./pages/admin/adminUserDetailsPage";

import AdminReportsPage
  from "./pages/admin/adminReportsPage";

import AdminReportDetailsPage
  from "./pages/admin/adminReportDetailsPage";

  import AdminAccessPage
  from "./pages/admin/adminAccessPage";

  import AdminTestimonialsPage
  from "./pages/admin/adminTestimonialPage";

  import AdminAuditLogsPage
  from "./pages/admin/adminAuditLogsPage";

  import AdminModerationDecisionPage
  from "./pages/admin/AdminModerationDecisionPage";
  import AdminRoute
  from "./routes/AdminRoute";
/*
|--------------------------------------------------------------------------
| Global fallback page
|--------------------------------------------------------------------------
*/

function NotFoundPage() {
  return (
    <main
      style={{
        display: "grid",
        minHeight: "100vh",
        placeItems: "center",
        padding: "24px",
        background: "#f5faf8",
        textAlign: "center"
      }}
    >
      <section>
        <p
          style={{
            margin: 0,
            color: "#287c69",
            fontSize: "14px",
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase"
          }}
        >
          Error 404
        </p>

        <h1
          style={{
            margin: "14px 0 8px",
            color: "#163d35",
            fontSize: "42px"
          }}
        >
          This page could not be found.
        </h1>

        <p
          style={{
            margin: "0 auto 22px",
            maxWidth: "500px",
            color: "#71847f",
            lineHeight: 1.7
          }}
        >
          The page may have been moved, deleted,
          or the address may be incorrect.
        </p>

        <a
          href="/"
          style={{
            display: "inline-flex",
            minHeight: "44px",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 20px",
            borderRadius: "999px",
            color: "#ffffff",
            background: "#287c69",
            fontWeight: 800,
            textDecoration: "none"
          }}
        >
          Return home
        </a>
      </section>
    </main>
  );
}

function App() {
  const [
    introComplete,
    setIntroComplete
  ] = useState(false);

  if (!introComplete) {
    return (
      <UnwindIntro
        onComplete={() => {
          setIntroComplete(true);
        }}
      />
    );
  }

  return (
    <Routes>
      {/*
      |--------------------------------------------------------------------------
      | Public routes
      |--------------------------------------------------------------------------
      */}

      <Route
        path="/"
        element={<LandingPage />}
      />

      <Route
  path="/info/:pageKey"
  element={
    <PublicInfoPage />
  }
/>

      {/*
      |--------------------------------------------------------------------------
      | Authentication routes
      |--------------------------------------------------------------------------
      */}

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />
<Route
  path="/auth/google/success"
  element={
    <GoogleAuthSuccessPage />
  }
/>

<Route
  path="/auth/google/complete-profile"
  element={
    <GoogleCompleteProfilePage />
  }
/>

<Route
  path="/auth/google/error"
  element={
    <GoogleAuthErrorPage />
  }
/>
        <Route
  path="/terms"
  element={<TermsPage />}
/>
        <Route
  path="/privacy"
  element={<PrivacyPage />}
/>

      <Route
        path="/verify-email"
        element={<VerifyEmailPage />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />

      {/*
      |--------------------------------------------------------------------------
      | Protected dashboard
      |--------------------------------------------------------------------------
      */}

      <Route
        element={<ProtectedRoute />}
      >
        <Route
          path="/dashboard"
          element={<DashboardLayout />}
        >
          {/*
          |--------------------------------------------------------------------------
          | Dashboard home
          |--------------------------------------------------------------------------
          */}

          <Route
            index
            element={<DashboardHomePage />}
          />

          {/*
          |--------------------------------------------------------------------------
          | Notifications
          |--------------------------------------------------------------------------
          */}

          <Route
  path="notifications"
  element={
    <NotificationsPage />
  }
/>

          {/*
          |--------------------------------------------------------------------------
          | AI companion
          |--------------------------------------------------------------------------
          */}

          <Route
  path="ai-companion"
  element={<AICompanionPage />}
/>

          {/*
          |--------------------------------------------------------------------------
          | Daily wellness trackers
          |--------------------------------------------------------------------------
          */}

          <Route
  path="trackers"
  element={<TrackersPage />}
/>

          {/*
          |--------------------------------------------------------------------------
          | Journal
          |--------------------------------------------------------------------------
          */}

          <Route
            path="journal"
            element={<JournalPage />}
          />

          {/*
          |--------------------------------------------------------------------------
          | DASS-21
          |--------------------------------------------------------------------------
          */}

          <Route
  path="/dashboard/dass"
  element={<DassPage />}
/>

          {/*
          |--------------------------------------------------------------------------
          | Community feed
          |--------------------------------------------------------------------------
          */}

          <Route
            path="community"
            element={<CommunityPage />}
          />

          {/*
          |--------------------------------------------------------------------------
          | Community chat
          |--------------------------------------------------------------------------
          */}

          <Route
  path="community-chat"
  element={
    <CommunityChatPage />
  }
/>

          {/*
          |--------------------------------------------------------------------------
          | Private community rooms
          |--------------------------------------------------------------------------
          */}

          <Route
  path="private-rooms"
  element={<PrivateRoomsPage />}
/>

          {/*
          |--------------------------------------------------------------------------
          | Direct messages
          |--------------------------------------------------------------------------
          */}

          <Route
  path="messages"
  element={
    <MessagesPage />
  }
/>

          {/*
          |--------------------------------------------------------------------------
          | Wellness toolkit
          |--------------------------------------------------------------------------
          */}

          <Route
  path="toolkit"
  element={<WellnessToolkit />}
/>

          <Route
  path="toolkit/breathing/:exerciseId"
  element={<BreathingPage />}
/>

          <Route
  path="toolkit/grounding"
  element={<GroundingPage />}
/>

          <Route
  path="toolkit/emotional-checkin"
  element={<EmotionalCheckin />}
/>

          <Route
  path="toolkit/thought-dump"
  element={<ThoughtDump />}
/>

          <Route
  path="toolkit/focus"
  element={<FocusPage />}
/>

           <Route
  path="toolkit/sounds"
  element={<CalmSounds />}
/>

           <Route
  path="toolkit/gratitude"
  element={<Gratitude />}
/>

           <Route
  path="toolkit/activity"
  element={<WellnessHistory />}
/>

           <Route
  path="toolkit/saved"
  element={<SavedTools />}
/>

           <Route
  path="toolkit/recent"
  element={<RecentTools />}
/>

           <Route
  path="toolkit/movement"
  element={<MovementBreak />}
/>

           <Route
  path="toolkit/body-scan"
  element={<BodyScan />}
/>
          {/*
          |--------------------------------------------------------------------------
          | Community reports and safety
          |--------------------------------------------------------------------------
          */}

          <Route
  path="reports"
  element={
    <SafetyReportsPage />
  }
/>

          {/*
          |--------------------------------------------------------------------------
          | User profile
          |--------------------------------------------------------------------------
          */}

          <Route
  path="profile"
  element={
    <Profile />
  }
/>

          {/*
          |--------------------------------------------------------------------------
          | Account settings
          |--------------------------------------------------------------------------
          */}

          <Route
  path="settings"
  element={
    <Setting />
  }
/>

<Route
  path="settings/security"
  element={
    <Setting />
  }
/>

          {/*
          |--------------------------------------------------------------------------
          | Backward-compatible aliases
          |--------------------------------------------------------------------------
          */}

          <Route
            path="chatbot"
            element={
              <Navigate
                to="/dashboard/ai-companion"
                replace
              />
            }
          />

          <Route
            path="assessment"
            element={
              <Navigate
                to="/dashboard/dass"
                replace
              />
            }
          />

          <Route
            path="chat"
            element={
              <Navigate
                to="/dashboard/community-chat"
                replace
              />
            }
          />

          <Route
            path="direct-messages"
            element={
              <Navigate
                to="/dashboard/messages"
                replace
              />
            }
          />

          {/*
          |--------------------------------------------------------------------------
          | Invalid dashboard route
          |--------------------------------------------------------------------------
          */}

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
        </Route>
      </Route>

{/*
|--------------------------------------------------------------------------
| Admin access
|--------------------------------------------------------------------------
*/}

<Route
  element={<ProtectedRoute />}
>
  <Route
    path="/admin/access"
    element={
      <AdminAccessPage />
    }
  />
</Route>


{/*
|--------------------------------------------------------------------------
| Protected admin panel
|--------------------------------------------------------------------------
*/}
{/*
|--------------------------------------------------------------------------
| Protected admin panel
|--------------------------------------------------------------------------
*/}

<Route
  element={<ProtectedRoute />}
>
  <Route
    element={<AdminRoute />}
  >
    <Route
      path="/admin"
      element={<AdminLayout />}
    >

      <Route
        index
        element={
          <AdminDashboardPage />
        }
      />

      <Route
        path="users"
        element={
          <AdminUsersPage />
        }
      />

      <Route
        path="users/:userId"
        element={
          <AdminUserDetailsPage />
        }
      />

      <Route
        path="reports"
        element={
          <AdminReportsPage />
        }
      />

      <Route
        path="reports/:reportId"
        element={
          <AdminReportDetailsPage />
        }
      />

      <Route
        path="decisions"
        element={
          <AdminModerationDecisionPage />
        }
      />

      <Route
        path="testimonials"
        element={
          <AdminTestimonialsPage />
        }
      />

      <Route
        path="audit-logs"
        element={
          <AdminAuditLogsPage />
        }
      />

    </Route>
  </Route>
</Route>
      {/*
      |--------------------------------------------------------------------------
      | Global not-found page
      |--------------------------------------------------------------------------
      */}

      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Routes>
  );
}

export default App;
