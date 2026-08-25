
import {
  ArrowLeft,
  Brain,
  FileText,
  HeartHandshake,
  LockKeyhole,
  MessageCircle,
  Scale,
  ShieldCheck,
  Sparkles,
  UserRoundCheck
} from "lucide-react";

import {
  useNavigate
} from "react-router-dom";
import UnwindLogo
  from "../../components/common/UnwindLogo";
import "./TermsPage.css";

const sections = [
  {
    number: "1",
    title: "Acceptance of Terms",
    icon: UserRoundCheck,
    content: (
      <>
        <p>
          By creating an account,
          accessing or using Unwind, or
          selecting the checkbox
          confirming acceptance of
          these Terms and Conditions,
          you agree to be legally bound
          by these Terms and acknowledge
          the Unwind Privacy Policy.
        </p>

        <p>
          If you do not agree to these
          Terms, you must not register
          for or use Unwind.
        </p>

        <p>
          Acceptance of these Terms does
          not by itself constitute
          consent to every form of
          personal-data processing.
          Where consent is required by
          applicable law, Unwind will
          provide an appropriate
          mechanism for obtaining such
          consent.
        </p>
      </>
    )
  },

  {
    number: "2",
    title: "Nature and Purpose of Unwind",
    icon: HeartHandshake,
    content: (
      <p>
        Unwind is a digital wellness and
        self-reflection platform. Its
        features may include user
        accounts, profiles, DASS-21
        assessments, wellness trackers,
        journals, voice notes and
        speech-to-text, AI-assisted
        conversations, community posts,
        public or private chat rooms,
        direct messages, media uploads,
        reminders and related features.
        Features may be modified, added,
        restricted or discontinued from
        time to time.
      </p>
    )
  },

  {
    number: "3",
    title:
      "Medical, Mental Health and Emergency Disclaimer",
    icon: Brain,
    content: (
      <>
        <p>
          Unwind is not a hospital,
          clinic, therapist,
          psychologist, psychiatrist,
          counsellor, emergency service
          or other healthcare provider.
        </p>

        <p>
          Content, DASS-21 scores,
          wellness statistics,
          recommendations and
          AI-generated responses are
          provided for informational,
          educational and
          self-reflection purposes only
          and do not constitute
          diagnosis, treatment or
          professional medical or
          mental-health advice.
        </p>

        <p>
          DASS-21 assessments and other
          wellness tools available
          through Unwind are
          self-reflection or screening
          tools and must not be
          interpreted as medical or
          psychiatric diagnoses.
        </p>

        <p>
          Users should seek an
          appropriately qualified
          professional for medical or
          mental-health decisions.
        </p>

        <p>
          Unwind does not provide or
          guarantee real-time monitoring
          of users, messages,
          assessments, journals,
          community activity or AI
          conversations for emergencies
          or crises. AI, community,
          direct-message and chat
          features must not be relied
          upon for emergency assistance
          or crisis intervention.
        </p>

        <p>
          If you believe that you or
          another person is facing an
          immediate risk of harm or a
          medical or mental-health
          emergency, contact the
          appropriate local emergency
          services or a qualified
          professional without relying
          on Unwind.
        </p>
      </>
    )
  },

  {
    number: "4",
    title:
      "Eligibility and Account Responsibilities",
    icon: UserRoundCheck,
    content: (
      <>
       <p>
  You must be legally eligible
  to use the Services and legally
  capable of agreeing to these
  Terms under applicable law.
  Where applicable law requires
  parental or guardian consent
  for use of the Services or
  processing of personal data,
  such consent must be obtained
  through the mechanisms provided
  by Unwind.
</p>

<p>
  Users must not create or use an
  account where doing so would
  violate applicable age,
  eligibility or consent
  requirements.
</p>
        <p>
          You agree to provide accurate
          account information, protect
          your password, verification
          credentials and journal PIN,
          and promptly report or address
          suspected unauthorised access.
        </p>

        <p>
          You may not impersonate
          another person, create an
          account using information you
          are not authorised to use, or
          access another person's
          account without authorisation.
        </p>
      </>
    )
  },

  {
    number: "5",
    title:
      "Privacy and Personal Data",
    icon: ShieldCheck,
    content: (
      <>
        <p>
          Use of Unwind may involve
          processing account
          information, profile
          information, assessment
          responses and results,
          wellness and tracker records,
          journal information, AI
          conversation data, community
          activity, messages, uploaded
          media, voice recordings,
          transcription data and
          technical or security
          information necessary to
          operate and protect the
          Services.
        </p>

        <p>
          The collection, use, storage,
          retention, disclosure and
          deletion of personal data are
          governed by the Unwind Privacy
          Policy and applicable
          data-protection law.
        </p>

        <p>
          Where processing requires
          consent under applicable law,
          Unwind will provide an
          appropriate consent mechanism.
          Users may also have rights
          relating to access,
          correction, deletion,
          withdrawal of consent or
          grievance redressal where
          provided by applicable law.
        </p>
      </>
    )
  },

  {
    number: "6",
    title:
      "Journal, Voice and Private Content",
    icon: LockKeyhole,
    content: (
      <>
        <p>
          Users may create journal
          entries and upload text,
          images, videos, audio or
          documents, and may use
          voice-note or speech-to-text
          features where available.
        </p>

        <p>
          Automated transcription may
          contain errors and should be
          reviewed before reliance.
          Journal PINs and other access
          controls provide additional
          protection but do not
          guarantee absolute security.
        </p>

        <p>
          Users are responsible for
          ensuring that they have the
          necessary rights, permissions
          or lawful basis to record,
          upload, store or disclose
          content involving another
          person.
        </p>

        <p>
          Users must not unlawfully
          record, upload or disclose
          another person's private
          information, communications,
          images, audio, video or other
          protected content.
        </p>
      </>
    )
  },

  {
    number: "7",
    title: "Artificial Intelligence",
    icon: Sparkles,
    content: (
      <>
        <p>
          Certain Unwind features may
          use artificial intelligence.
          Where users interact with an
          AI-assisted feature, responses
          are generated or assisted by
          automated systems and should
          be treated accordingly.
        </p>

        <p>
          AI-generated responses may be
          inaccurate, incomplete,
          outdated, misleading or
          inappropriate and should not
          be treated as verified facts,
          diagnoses or professional
          medical, mental-health, legal,
          financial or other
          professional advice.
        </p>

        <p>
          Users remain responsible for
          evaluating AI output and for
          decisions made using such
          output.
        </p>

        <p>
          Unwind may use third-party AI,
          cloud or infrastructure
          providers where reasonably
          necessary to provide
          AI-assisted functionality.
          Information submitted to an
          AI-assisted feature may
          therefore be processed by
          relevant service providers as
          described in the Unwind
          Privacy Policy and subject to
          applicable law.
        </p>

        <p>
          Users should avoid submitting
          information to AI features
          that they do not wish to be
          processed as necessary to
          provide those features.
        </p>
      </>
    )
  },

  {
    number: "8",
    title:
      "Community, Chat and Anonymous Use",
    icon: MessageCircle,
    content: (
      <>
        <p>
          Unwind may permit community
          posts, comments, public or
          private rooms, direct messages
          and anonymous participation.
          Community content is
          user-generated and does not
          necessarily represent
          Unwind's views.
        </p>

        <p>
          "Anonymous" means that a
          user's identity may be
          concealed from other users in
          the relevant interface. It
          does not mean that use is
          technically untraceable or
          that Unwind cannot retain
          internal account, security or
          moderation information.
        </p>

        <p>
          Unwind may retain internal
          identifiers, reports or
          relevant records where
          reasonably necessary for
          security, moderation, abuse
          prevention, fraud prevention,
          legal compliance or
          enforcement of these Terms.
        </p>

        <p>
          Recipients of private or
          anonymous communications may
          independently copy, record,
          screenshot or disclose them.
          Users should therefore
          exercise appropriate care when
          sharing information with other
          users.
        </p>
      </>
    )
  },

  {
    number: "9",
    title: "Prohibited Conduct",
    icon: ShieldCheck,
    content: (
      <p>
        Users must not use Unwind to
        harass, threaten, stalk, defraud
        or impersonate others; promote
        unlawful violence or intentional
        self-harm; exploit or endanger
        minors; distribute unlawful,
        abusive or infringing material;
        expose another person's private
        information without authority;
        distribute malware or spam;
        conduct phishing, credential
        theft or unauthorised access;
        circumvent or interfere with
        authentication, rate limits or
        other security controls; scrape
        personal data without
        authorisation; attempt to
        disrupt the Platform or its
        infrastructure; or otherwise
        violate applicable law or these
        Terms.
      </p>
    )
  },

  {
    number: "10",
    title:
      "User Content, Reporting and Moderation",
    icon: FileText,
    content: (
      <>
        <p>
          You retain applicable
          ownership rights in original
          content you create.
        </p>

        <p>
          By submitting content where
          storage, processing, display
          or transmission is required to
          provide a selected feature,
          you grant Unwind a limited,
          non-exclusive licence to
          process that content only as
          reasonably necessary to
          operate, secure, moderate and
          provide the Services, subject
          to the Privacy Policy and
          applicable law.
        </p>

        <p>
          Users may report content,
          accounts or conduct through
          reporting functionality made
          available within Unwind or by
          contacting Unwind through the
          contact information provided
          in these Terms.
        </p>

        <p>
          Reports may be reviewed by
          authorised administrators or
          moderators. Submission of a
          report does not guarantee a
          particular outcome, but Unwind
          may take action where
          reasonably necessary under
          these Terms or applicable law.
        </p>

        <p>
          Such action may include
          restricting or removing
          content, limiting
          functionality, issuing
          warnings, preserving relevant
          records, or temporarily or
          permanently suspending an
          account.
        </p>

        <p>
          Unwind may also act where
          reasonably necessary to
          protect users, investigate
          abuse, maintain Platform
          security or comply with
          applicable legal obligations.
        </p>
      </>
    )
  },

  {
    number: "11",
    title:
      "Intellectual Property",
    icon: FileText,
    content: (
      <p>
        Except for User Content and
        third-party materials, the
        Unwind software, interface,
        branding, graphics, original
        content and related intellectual
        property are owned by or
        licensed to Unwind. No ownership
        rights are transferred to users.
        Unauthorised copying, commercial
        exploitation, reverse
        engineering or distribution is
        prohibited except where
        applicable law expressly permits
        it.
      </p>
    )
  },

  {
    number: "12",
    title:
      "Third-Party Services and Availability",
    icon: FileText,
    content: (
      <>
        <p>
          Unwind may rely on independent
          third-party providers for
          hosting, frontend delivery,
          databases, authentication,
          email, media or file storage,
          artificial intelligence,
          speech processing, analytics,
          security or other
          infrastructure and services.
        </p>

        <p>
          Relevant information may be
          processed by these providers
          where reasonably necessary to
          provide the selected feature,
          operate the Platform or
          maintain security, as further
          described in the Unwind
          Privacy Policy.
        </p>

        <p>
          Unwind does not guarantee
          uninterrupted or error-free
          availability and may perform
          maintenance, introduce
          updates, restrict access or
          modify functionality.
        </p>

        <p>
          To the extent permitted by
          applicable law, Unwind is not
          responsible for failures,
          outages or acts of independent
          third-party services outside
          its reasonable control.
        </p>
      </>
    )
  },

  {
    number: "13",
    title:
      "Suspension, Termination and Account Deletion",
    icon: LockKeyhole,
    content: (
      <>
        <p>
          Unwind may restrict, suspend
          or terminate an account where
          reasonably necessary because
          of material violations of
          these Terms, unlawful or
          abusive conduct, fraud,
          security risks, repeated
          harmful conduct, legal
          requirements or material risks
          to users or the Platform.
        </p>

        <p>
          Depending on the circumstances
          and applicable law, suspension
          may be temporary or permanent.
        </p>

        <p>
          Users may request account
          deletion through available
          account settings or support
          mechanisms.
        </p>

        <p>
          When an account is deleted,
          personal information and
          associated content will be
          deleted, anonymised or
          otherwise handled in
          accordance with the Unwind
          Privacy Policy, applicable law
          and the technical requirements
          of the Services.
        </p>

        <p>
          Certain information may remain
          temporarily in backups or may
          be retained where reasonably
          necessary or legally permitted
          for security, fraud and abuse
          prevention, dispute
          resolution, enforcement,
          record-keeping or compliance
          with legal obligations.
        </p>

        <p>
          Content previously shared with
          other users may not always be
          capable of being withdrawn
          from copies independently
          created or retained by those
          users.
        </p>
      </>
    )
  },

  {
    number: "14",
    title:
      "Security and User Responsibility",
    icon: ShieldCheck,
    content: (
      <>
        <p>
          Unwind uses reasonable
          technical and organisational
          measures intended to protect
          the Platform and user
          information. However, no
          internet-based service,
          transmission method, storage
          system or security control can
          guarantee absolute security.
        </p>

        <p>
          Users are responsible for
          maintaining the
          confidentiality of their
          passwords, verification
          credentials, journal PINs and
          other account-access
          information.
        </p>

        <p>
          Suspected unauthorised access,
          security vulnerabilities or
          misuse should be reported to
          Unwind as soon as reasonably
          possible.
        </p>
      </>
    )
  },

  {
    number: "15",
    title:
      "Disclaimer and Limitation of Liability",
    icon: Scale,
    content: (
      <>
        <p>
          To the maximum extent
          permitted by applicable law,
          Unwind is provided on an "as
          is" and "as available" basis
          without a guarantee that every
          feature, assessment, AI
          response, user-generated
          statement, communication or
          service will be accurate,
          complete, available, secure or
          error-free.
        </p>

        <p>
          To the extent permitted by
          applicable law, Unwind will
          not be liable for indirect,
          incidental, special or
          consequential loss arising
          from reliance on AI output,
          assessments, user-generated
          content, communications with
          other users, third-party
          services or interruptions
          where such liability may
          lawfully be excluded.
        </p>

        <p>
          Users remain responsible for
          exercising appropriate
          judgement when acting on
          information obtained through
          the Platform.
        </p>

        <p>
          Nothing in these Terms
          excludes or limits liability,
          consumer rights, privacy
          rights or other statutory
          rights that cannot legally be
          excluded or limited.
        </p>
      </>
    )
  },

  {
    number: "16",
    title:
      "Changes to These Terms",
    icon: FileText,
    content: (
      <>
        <p>
          These Terms may be updated to
          reflect changes in law,
          security requirements,
          functionality, third-party
          services or Unwind's
          operations.
        </p>

        <p>
          The current version will
          display its effective or
          last-updated date. Where
          required by applicable law or
          where a material change
          requires renewed acceptance or
          consent, Unwind may provide
          additional notice or request
          acceptance again before
          continued use of relevant
          Services.
        </p>
      </>
    )
  },

  {
    number: "17",
    title:
      "Governing Law and Disputes",
    icon: Scale,
    content: (
      <p>
        These Terms are governed by the
        laws of India. Subject to
        mandatory consumer,
        data-protection and other
        statutory rights, courts of
        competent jurisdiction in
        Mumbai, Maharashtra shall have
        jurisdiction over disputes
        relating to the Services.
        Nothing in these Terms prevents
        a user from approaching a
        competent statutory, consumer,
        regulatory or judicial authority
        where applicable law provides
        such a right.
      </p>
    )
  },

  {
    number: "18",
    title:
      "Contact, Privacy Requests and Grievances",
    icon: MessageCircle,
    content: (
      <>
        <p>
          Questions concerning these
          Terms, legal notices, privacy
          requests, reports, security
          concerns or grievances may be
          directed to Unwind using the
          contact information below.
        </p>

        <div className="terms-contact-box">
          <strong>
            Unwind
          </strong>

          <span>
            Official Email:
            {" "}
            projectunwind00@gmail.com
          </span>

          <span>
            Privacy Contact:
            {" "}
            projectunwind00@gmail.com
          </span>

          <span>
            Grievance Contact:
            {" "}
            Unwind Support Team
          </span>

          <span>
            Grievance Email:
            {" "}
            projectunwind00@gmail.com
          </span>
        </div>

        <p>
          Users submitting a grievance
          or privacy request should
          provide sufficient information
          for Unwind to identify and
          review the request. Additional
          verification may be requested
          where reasonably necessary to
          protect account security and
          personal information.
        </p>
      </>
    )
  }
];

function TermsPage() {
  const navigate =
    useNavigate();

  return (
    <main className="terms-page">
      <nav className="terms-nav">
        <button
          type="button"
          className="terms-back-button"
         onClick={() =>
  navigate("/register")

          }
        >
          <ArrowLeft
            size={17}
          />

          Back
        </button>

       <div className="terms-brand">
  <UnwindLogo
    variant="symbol"
    theme="dark"
    className="terms-brand__logo"
  />

  <span>
    Unwind
  </span>
</div>
      </nav>

      <header className="terms-hero">
        <div className="terms-hero__icon">
          <FileText
            size={28}
          />
        </div>

        <span className="terms-eyebrow">
          Legal
        </span>

        <h1>
          Terms and Conditions
        </h1>

        <p className="terms-hero__lead">
          Please read these Terms
          carefully before creating or
          using your Unwind account.
        </p>

        <div className="terms-dates">
          <span>
            Effective Date:
            {" "}
            24/08/2026
          </span>

          <i />

          <span>
            Last Updated:
            {" "}
            24/08/2026
          </span>
        </div>
      </header>

      <section className="terms-important">
        <ShieldCheck
          size={21}
        />

        <div>
          <strong>
            Important wellness notice
          </strong>

          <p>
            Unwind is a wellness and
            self-reflection platform.
            It is not a substitute for
            professional healthcare,
            mental-health treatment or
            emergency services.
          </p>
        </div>
      </section>

      <section className="terms-intro">
        <p>
          These Terms govern access to
          and use of Unwind. By creating
          an account, accessing or using
          Unwind, or selecting the
          registration acceptance
          checkbox, you agree to be
          legally bound by these Terms
          and acknowledge the Unwind
          Privacy Policy.
        </p>
      </section>

      <div className="terms-content">
        {sections.map(
          ({
            number,
            title,
            icon: Icon,
            content
          }) => (
            <article
              key={number}
              className="terms-section"
              id={`terms-${number}`}
            >
              <div className="terms-section__icon">
                <Icon
                  size={18}
                />
              </div>

              <div className="terms-section__body">
                <span className="terms-section__number">
                  Section {number}
                </span>

                <h2>
                  {title}
                </h2>

                <div className="terms-section__copy">
                  {content}
                </div>
              </div>
            </article>
          )
        )}
      </div>

      <section className="terms-acceptance">
        <div className="terms-acceptance__icon">
          <UserRoundCheck
            size={24}
          />
        </div>

        <div>
          <span>
            Sign-up acceptance
          </span>

          <h2>
            Your agreement when
            registering
          </h2>

          <p>
            By selecting the registration
            checkbox and creating an
            account, you confirm:
          </p>

          <blockquote>
            “I have read and agree to the
            Unwind Terms and Conditions
            and acknowledge the Privacy
            Policy.”
          </blockquote>

          <p>
            Registration cannot proceed
            unless this acceptance is
            confirmed.
          </p>
        </div>
      </section>

      <footer className="terms-footer">
        <strong>
          UNWIND
        </strong>

        <p>
          Wellness • Reflection •
          Community
        </p>

        <span>
          © 2026 Unwind. All rights
          reserved.
        </span>
      </footer>
    </main>
  );
}

export default TermsPage;
