import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter
} from "react-router-dom";
import {
  PostHogProvider
} from "@posthog/react";

import App from "./App";

import {
  ConfirmDialogProvider
} from "./context/ConfirmDialogContext";
import {
  AuthProvider
} from "./context/AuthContext";
import {
  ThemeProvider
} from "./context/ThemeContext";

import "./styles/responsive.css";
import "./index.css";


const posthogOptions = {
  api_host:
    import.meta.env.VITE_POSTHOG_HOST,

  defaults:
    "2026-05-30",

  capture_pageview:
    "history_change",

  capture_pageleave:
    true,

  /*
   * Unwind contains sensitive wellness data.
   * Track named events manually instead of
   * automatically collecting every click.
   */
  autocapture:
    false,

  /*
   * Prevent PostHog from building user profiles
   * until the user is deliberately identified.
   */
  person_profiles:
    "identified_only",

  /*
   * Privacy protection for session recordings.
   */
  session_recording: {
    maskAllInputs:
      true,

    maskTextSelector:
      "*"
  }
};


ReactDOM.createRoot(
  document.getElementById(
    "root"
  )
).render(
  <React.StrictMode>
    <PostHogProvider
      apiKey={
        import.meta.env
          .VITE_POSTHOG_PROJECT_TOKEN
      }
      options={
        posthogOptions
      }
    >
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ConfirmDialogProvider>
              <App />
            </ConfirmDialogProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </PostHogProvider>
  </React.StrictMode>
);