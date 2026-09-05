import {
  lazy,
  Suspense,
  useState
} from "react";

import {
  Navigate,
  Route,
  Routes,
  useLocation
} from "react-router-dom";


/*
|--------------------------------------------------------------------------
| Core components
|--------------------------------------------------------------------------
*/

import UnwindIntro
  from "./components/intro/UnwindIntro.jsx";

import AppLoader
  from "./components/common/AppStates/AppLoader";


/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

import LoginPage
  from "./pages/Auth/LoginPage";

import RegisterPage
  from "./pages/Auth/RegisterPage";

import VerifyEmailPage
  from "./pages/Auth/VerifyEmailPage";

import ForgotPasswordPage
  from "./pages/Auth/ForgotPasswordPage";

import ResetPasswordPage
  from "./pages/Auth/ResetPasswordLinkPage";

import GoogleAuthSuccessPage
  from "./pages/Auth/GoogleAuthSuccessPage.jsx";

import GoogleCompleteProfilePage
  from "./pages/Auth/GoogleCompleteProfilePage.jsx";

import GoogleAuthErrorPage
  from "./pages/Auth/GoogleAuthErrorPage.jsx";


/*
|--------------------------------------------------------------------------
| Public pages
|--------------------------------------------------------------------------
*/

import LandingPage
  from "./pages/Landing/LandingPage";

import TermsPage
  from "./pages/Terms/TermsPage";

import PrivacyPage
  from "./pages/Privacy/PrivacyPage";

import PublicInfoPage
  from "./pages/PublicInfo/PublicInfoPage.jsx";

import NotFoundPage
  from "./pages/NotFound/NotFoundPage";


/*
|--------------------------------------------------------------------------
| Layouts and route protection
|--------------------------------------------------------------------------
*/

import AdminLayout
  from "./layouts/AdminLayout";

import DashboardLayout
  from "./layouts/DashboardLayout";

import ProtectedRoute
  from "./routes/ProtectedRoute";

import AdminRoute
  from "./routes/AdminRoute";


/*
|--------------------------------------------------------------------------
| Dashboard pages
|--------------------------------------------------------------------------
*/

import DashboardHomePage
  from "./pages/Dashboard/DashboardHome";

import Profile
  from "./pages/Dashboard/Profile";

import Setting
  from "./pages/Dashboard/Setting";

import SafetyReportsPage
  from "./pages/Reports/SafetyReportsPage";

import DashboardPlaceholderPage
  from "./pages/Dashboard/DashboardPlaceHolderPage";

import NotificationRedirectPage
  from "./pages/Notifications/NotificationRedirectPage";


/*
|--------------------------------------------------------------------------
| Wellness toolkit exercise pages
|--------------------------------------------------------------------------
*/

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
| Admin access
|--------------------------------------------------------------------------
*/

import AdminAccessPage
  from "./pages/admin/adminAccessPage";


/*
|--------------------------------------------------------------------------
| Lazy-loaded dashboard pages
|--------------------------------------------------------------------------
*/

const CommunityPage =
  lazy(() =>
    import(
      "./pages/Community/CommunityPage"
    )
  );

const TrackersPage =
  lazy(() =>
    import(
      "./pages/Trackers/TrackersPage"
    )
  );

const DassPage =
  lazy(() =>
    import(
      "./pages/Dass/DassPage"
    )
  );

const AICompanionPage =
  lazy(() =>
    import(
      "./pages/AICompanion/AICompanionPage"
    )
  );

const PrivateRoomsPage =
  lazy(() =>
    import(
      "./pages/Messages/PrivateRoomsPage"
    )
  );

const MessagesPage =
  lazy(() =>
    import(
      "./pages/Messages/MessagesPage"
    )
  );

const CommunityChatPage =
  lazy(() =>
    import(
      "./pages/Messages/CommunityChatPage"
    )
  );

const JournalPage =
  lazy(() =>
    import(
      "./pages/Journal/JournalPage"
    )
  );

const NotificationsPage =
  lazy(() =>
    import(
      "./pages/Notifications/NotificationsPage"
    )
  );

const WellnessToolkit =
  lazy(() =>
    import(
      "./pages/WellnessToolkit/WellnessToolkit"
    )
  );


/*
|--------------------------------------------------------------------------
| Lazy-loaded admin pages
|--------------------------------------------------------------------------
*/

const AdminDashboardPage =
  lazy(() =>
    import(
      "./pages/admin/adminDashboardPage"
    )
  );

const AdminAnalyticsPage =
  lazy(() =>
    import(
      "./pages/admin/AdminAnalyticsPage"
    )
  );

const AdminUsersPage =
  lazy(() =>
    import(
      "./pages/admin/adminUsersPage"
    )
  );

const AdminUserDetailsPage =
  lazy(() =>
    import(
      "./pages/admin/adminUserDetailsPage"
    )
  );

const AdminReportsPage =
  lazy(() =>
    import(
      "./pages/admin/adminReportsPage"
    )
  );

const AdminReportDetailsPage =
  lazy(() =>
    import(
      "./pages/admin/adminReportDetailsPage"
    )
  );

const AdminTestimonialsPage =
  lazy(() =>
    import(
      "./pages/admin/adminTestimonialPage"
    )
  );

const AdminAuditLogsPage =
  lazy(() =>
    import(
      "./pages/admin/adminAuditLogsPage"
    )
  );

const AdminModerationDecisionPage =
  lazy(() =>
    import(
      "./pages/admin/AdminModerationDecisionPage"
    )
  );


/*
|--------------------------------------------------------------------------
| Application
|--------------------------------------------------------------------------
*/

function App() {
  const location =
    useLocation();

  const [
    introComplete,
    setIntroComplete
  ] = useState(() => {
    return (
      sessionStorage.getItem(
        "unwind_intro_seen"
      ) === "true"
    );
  });


  const skipIntro =
    localStorage.getItem(
      "unwind_skip_intro"
    ) === "true";


  const shouldShowIntro =
    location.pathname === "/" &&
    !skipIntro &&
    !introComplete;


  if (shouldShowIntro) {
    return (
      <UnwindIntro
        onComplete={() => {
          sessionStorage.setItem(
            "unwind_intro_seen",
            "true"
          );

          setIntroComplete(true);
        }}
      />
    );
  }


  return (
    <Suspense
      fallback={
        <AppLoader
          fullScreen
          size="large"
          message="Preparing your Unwind space…"
        />
      }
    >
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
  path="/notifications"
  element={
    <NotificationRedirectPage />
  }
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
    <NotFoundPage />
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
  path="analytics"
  element={
    <AdminAnalyticsPage />
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
    </Suspense>
  );
}

export default App;
