
import {
  ArrowLeft,
  Bot,
  Brain,
  Cookie,
  Database,
  FileText,
  Globe2,
  KeyRound,
  LockKeyhole,
  Mail,
  MessageCircle,
  Mic,
  Scale,
  Server,
  ShieldCheck,
  Trash2,
  UserRound,
  UserRoundCheck
} from "lucide-react";
import UnwindLogo
  from "../../components/common/UnwindLogo";
import {
  useNavigate
} from "react-router-dom";

import "../Terms/TermsPage.css";

const privacySections = [
  {
    number: "1",
    title:
      "Information We Collect",
    icon: Database,

    content: (
      <>
        <p>
          The personal information
          processed by Unwind depends on
          the features you choose to
          use and the information you
          voluntarily provide.
        </p>

        <p>
          This may include account and
          profile information,
          assessment responses and
          results, wellness and tracker
          records, journal information,
          voice recordings and
          transcripts, AI conversation
          data, community activity,
          messages, uploaded media and
          technical or security
          information generated while
          using the platform.
        </p>

        <p>
          Unwind aims to collect and
          process only information that
          is reasonably necessary for
          legitimate and disclosed
          purposes associated with the
          Services.
        </p>
      </>
    )
  },

  {
    number: "2",
    title:
      "Account and Profile Information",
    icon: UserRound,

    content: (
      <>
        <p>
          When you create and maintain
          an Unwind account, we may
          process information you
          provide such as your email
          address, username, name,
          profile information and other
          information required for
          registration or account
          functionality.
        </p>

        <p>
          Account-related information
          may also be processed where
          necessary for authentication,
          email verification, account
          recovery, security, account
          management and prevention of
          unauthorised access.
        </p>
      </>
    )
  },

  {
    number: "3",
    title:
      "Wellness, Assessment and Potentially Sensitive Data",
    icon: Brain,

    content: (
      <>
        <p>
          When you use wellness
          features, Unwind may process
          information you voluntarily
          provide through wellness
          trackers, self-reflection
          tools and assessments such as
          DASS-21.
        </p>

        <p>
          Depending on applicable law,
          some wellness, emotional,
          psychological or similar
          information may be considered
          sensitive, special-category or
          otherwise specially protected
          personal information.
        </p>

        <p>
          Where applicable law requires
          a particular legal basis,
          explicit consent or additional
          safeguards for such
          information, Unwind will
          process the information only
          in accordance with those
          requirements.
        </p>

        <p>
          This information may be used
          to operate the selected
          feature, calculate or display
          results, maintain your
          wellness records and provide
          relevant self-reflection
          functionality.
        </p>

        <div className="terms-important">
          <ShieldCheck size={19} />

          <div>
            <strong>
              Wellness information
            </strong>

            <p>
              Assessment scores and
              wellness information are
              provided for informational
              and self-reflection
              purposes. Unwind does not
              provide medical diagnosis,
              treatment or professional
              mental-health care.
            </p>
          </div>
        </div>
      </>
    )
  },

  {
    number: "4",
    title:
      "Journal and Private Content",
    icon: LockKeyhole,

    content: (
      <>
        <p>
          If you use Unwind's journal
          or other private-content
          features, Unwind may store and
          process the content you choose
          to submit so that those
          features can operate.
        </p>

        <p>
          Journal access controls,
          including a journal PIN where
          available, are intended to
          provide additional protection.
          No technical security measure,
          however, can guarantee
          absolute confidentiality or
          security.
        </p>

        <p>
          You should avoid including
          another person's private or
          personal information unless
          you have the necessary lawful
          authority, permission or other
          legal basis to do so.
        </p>
      </>
    )
  },

  {
    number: "5",
    title:
      "Voice Notes and Speech-to-Text",
    icon: Mic,

    content: (
      <>
        <p>
          Where voice-note,
          transcription or
          speech-to-text features are
          available, Unwind may process
          audio and resulting transcript
          information as necessary to
          provide the feature you
          requested.
        </p>

        <p>
          Audio or transcript
          information may be processed
          through third-party
          infrastructure or speech
          processing providers where
          required to provide the
          relevant functionality.
        </p>

        <p>
          Automated transcription may
          contain errors. Users should
          review generated transcripts
          before relying on them.
        </p>
      </>
    )
  },

  {
    number: "6",
    title:
      "AI Companion and Artificial Intelligence",
    icon: Bot,

    content: (
      <>
        <p>
          When you use AI-assisted
          features, information from
          your conversation or other
          information submitted to that
          feature may be processed as
          necessary to generate and
          deliver a response.
        </p>

        <p>
          Unwind may use third-party AI,
          cloud or infrastructure
          providers where reasonably
          necessary to provide these
          features. Information sent to
          an AI-assisted feature may
          therefore be transmitted to
          and processed by relevant
          service providers.
        </p>

        <p>
          Users should avoid submitting
          information to AI features
          that they do not wish to be
          processed as necessary for
          providing those features.
        </p>

        <p>
          AI responses may be
          inaccurate, incomplete,
          outdated, misleading or
          inappropriate and must not be
          considered verified facts,
          medical advice, diagnosis,
          treatment or professional
          mental-health advice.
        </p>

        <p>
          Unwind's AI-assisted features
          are not intended to make
          automated decisions that
          produce legal or similarly
          significant effects concerning
          a user.
        </p>
      </>
    )
  },

  {
    number: "7",
    title:
      "Community, Private Rooms and Direct Messages",
    icon: MessageCircle,

    content: (
      <>
        <p>
          If you participate in
          community features, Unwind may
          process posts, comments,
          private-room activity, direct
          messages and related
          information required to
          deliver, secure and moderate
          those services.
        </p>

        <p>
          Content submitted to public or
          community areas may be visible
          to other users according to
          the functionality and privacy
          settings of the relevant
          feature.
        </p>

        <p>
          Where an anonymous
          participation feature is
          provided, your displayed
          identity may be hidden from
          other users. Anonymous
          participation does not mean
          that activity is technically
          untraceable.
        </p>

        <p>
          Internal identifiers, reports
          or related records may be
          retained where reasonably
          necessary for security,
          moderation, abuse prevention,
          fraud prevention, dispute
          resolution, enforcement or
          legal compliance.
        </p>

        <p>
          Recipients of private
          communications may
          independently copy,
          screenshot, record or disclose
          those communications. Unwind
          cannot control copies created
          independently by other users.
        </p>
      </>
    )
  },

  {
    number: "8",
    title:
      "Uploaded Media and Files",
    icon: FileText,

    content: (
      <>
        <p>
          Certain Unwind features may
          allow you to upload content
          such as text, images, videos,
          audio or documents.
        </p>

        <p>
          Uploaded content may be
          stored, processed, scanned or
          transmitted as reasonably
          necessary to provide the
          feature you selected, maintain
          platform security, prevent
          abuse and comply with
          applicable legal obligations.
        </p>

        <p>
          Users are responsible for
          ensuring that they have the
          necessary rights or lawful
          authority to upload and
          process content involving
          other persons.
        </p>
      </>
    )
  },

  {
    number: "9",
    title:
      "How and Why We Use Information",
    icon: UserRoundCheck,

    content: (
      <>
        <p>
          Personal information may be
          processed where reasonably
          necessary to:
        </p>

        <ul>
          <li>
            Create, maintain and manage
            your account.
          </li>

          <li>
            Authenticate users and
            secure access to Unwind.
          </li>

          <li>
            Provide features and
            services requested by you.
          </li>

          <li>
            Maintain wellness,
            assessment and
            self-reflection
            functionality.
          </li>

          <li>
            Provide journals,
            community features,
            messaging and private-room
            functionality.
          </li>

          <li>
            Provide AI-assisted,
            speech-processing and
            transcription functionality.
          </li>

          <li>
            Maintain reliability,
            diagnose technical issues
            and improve platform
            performance.
          </li>

          <li>
            Detect, prevent and
            investigate fraud, abuse,
            security incidents and
            violations of Unwind's
            Terms.
          </li>

          <li>
            Respond to user requests,
            reports and grievances.
          </li>

          <li>
            Establish, exercise or
            defend legal claims where
            permitted by law.
          </li>

          <li>
            Comply with applicable
            legal and regulatory
            obligations.
          </li>
        </ul>
      </>
    )
  },

  {
    number: "10",
    title:
      "Legal Bases for Processing",
    icon: Scale,

    content: (
      <>
        <p>
          The legal basis used for
          processing personal
          information depends on the
          applicable law, the type of
          information involved and the
          purpose of the processing.
        </p>

        <p>
          Where applicable law requires
          identification of a legal
          basis, Unwind may rely on one
          or more of the following as
          appropriate:
        </p>

        <ul>
          <li>
            Your consent, where valid
            consent is required or
            appropriate.
          </li>

          <li>
            Performance of a contract
            or steps requested by you
            before entering into a
            contract.
          </li>

          <li>
            Compliance with a legal
            obligation.
          </li>

          <li>
            Legitimate interests, where
            recognised by applicable
            law and where those
            interests are not overridden
            by applicable user rights.
          </li>

          <li>
            Protection of vital
            interests where applicable
            law recognises such a basis.
          </li>

          <li>
            Any other lawful basis
            available under applicable
            data-protection law.
          </li>
        </ul>

        <p>
          Where processing is based on
          consent, users may withdraw
          that consent as permitted by
          applicable law. Withdrawal
          does not affect processing
          lawfully carried out before
          withdrawal.
        </p>
      </>
    )
  },

  {
    number: "11",
    title:
      "Technical and Security Information",
    icon: KeyRound,

    content: (
      <>
        <p>
          Unwind may process technical
          information reasonably
          necessary to operate and
          secure the Services.
        </p>

        <p>
          Depending on how the Services
          are accessed, this may include
          authentication records,
          session information, IP or
          network information, browser
          information, device or
          operating-system information,
          timestamps, request metadata,
          security logs and similar
          technical records.
        </p>

        <p>
          This information may be used
          to maintain sessions, protect
          accounts, prevent abuse,
          investigate suspicious
          activity, diagnose technical
          problems and improve platform
          security.
        </p>
      </>
    )
  },

  {
    number: "12",
    title:
      "Cookies and Similar Technologies",
    icon: Cookie,

    content: (
      <>
        <p>
          Unwind may use cookies,
          browser storage or similar
          technologies that are
          necessary for authentication,
          maintaining user sessions,
          security, preferences and
          operation of the platform.
        </p>

        <p>
          Where non-essential cookies or
          similar technologies are used
          and applicable law requires
          consent or another choice
          mechanism, Unwind will provide
          the legally required notice
          and controls.
        </p>

        <p>
          Disabling technologies that
          are strictly necessary for
          authentication or security may
          prevent certain features from
          functioning correctly.
        </p>
      </>
    )
  },

  {
    number: "13",
    title:
      "Third-Party Service Providers and Recipients",
    icon: Server,

    content: (
      <>
        <p>
          Unwind may rely on independent
          service providers and
          processors that support the
          operation of the platform.
        </p>

        <p>
          Depending on the functionality
          being used, these providers
          may support hosting, frontend
          delivery, databases,
          authentication, email,
          media or file storage,
          artificial intelligence,
          speech processing, monitoring,
          security or other technical
          infrastructure.
        </p>

        <p>
          Personal information may be
          provided to such providers
          only where reasonably
          necessary for the relevant
          purpose and subject to
          applicable contractual,
          privacy and data-protection
          requirements.
        </p>

        <p>
          Information may also be
          disclosed where required by
          applicable law, valid legal
          process, regulatory
          requirements, or where
          reasonably necessary to
          protect the rights, safety or
          security of Unwind, its users
          or others, subject to
          applicable law.
        </p>
      </>
    )
  },

  {
    number: "14",
    title:
      "International Data Transfers",
    icon: Globe2,

    content: (
      <>
        <p>
          Unwind and its third-party
          service providers may process
          or store information in
          countries other than the
          country in which a user is
          located.
        </p>

        <p>
          Data-protection laws in those
          countries may differ from the
          laws applicable in the user's
          location.
        </p>

        <p>
          Where applicable law requires
          safeguards for international
          transfers of personal
          information, Unwind will use
          an appropriate lawful transfer
          mechanism or other legally
          recognised safeguard.
        </p>
      </>
    )
  },

  {
    number: "15",
    title:
      "Sale, Advertising and Commercial Use of Personal Information",
    icon: ShieldCheck,

    content: (
      <>
        <p>
          Unwind does not use personal
          information for purposes that
          are materially incompatible
          with the purposes described in
          this Privacy Policy without
          providing any notice, consent
          or choice required by
          applicable law.
        </p>

        <p>
          If Unwind introduces
          advertising, data-sharing or
          other commercial processing
          that constitutes a "sale",
          "sharing", targeted
          advertising or similar
          activity under applicable
          privacy law, this Privacy
          Policy and any required
          notices or opt-out mechanisms
          will be updated before or when
          such processing becomes
          applicable.
        </p>
      </>
    )
  },

  {
    number: "16",
    title:
      "Security of Your Information",
    icon: ShieldCheck,

    content: (
      <>
        <p>
          Unwind uses reasonable
          technical and organisational
          safeguards intended to protect
          personal information against
          unauthorised access,
          alteration, disclosure,
          destruction or loss.
        </p>

        <p>
          Security measures may include
          authentication controls,
          access restrictions, secure
          communications, credential
          protection and other measures
          appropriate to the nature of
          the Services.
        </p>

        <p>
          Users are also responsible for
          protecting passwords,
          verification credentials,
          journal PINs and other account
          security information and
          should not share those
          credentials with other
          persons.
        </p>

        <p>
          No internet-based platform,
          transmission method or storage
          system can guarantee absolute
          security.
        </p>
      </>
    )
  },

  {
    number: "17",
    title:
      "Security Incidents and Data Breaches",
    icon: ShieldCheck,

    content: (
      <>
        <p>
          Unwind may investigate
          suspected security incidents
          affecting personal
          information and take
          reasonable measures to
          contain, mitigate and address
          identified risks.
        </p>

        <p>
          Where applicable law requires
          notification of a personal
          data breach or security
          incident to affected users,
          regulators or other
          authorities, Unwind will
          provide such notification in
          accordance with applicable
          requirements.
        </p>
      </>
    )
  },

  {
    number: "18",
    title:
      "Data Retention and Account Deletion",
    icon: Trash2,

    content: (
      <>
        <p>
          Unwind retains personal
          information only for as long
          as reasonably necessary for
          the purposes for which it was
          collected or processed,
          including providing the
          Services, maintaining
          security, complying with legal
          obligations and resolving
          disputes.
        </p>

        <p>
          Retention periods may vary
          depending on the category of
          information, the feature being
          used, legal requirements,
          security needs and whether the
          information remains necessary
          for the purposes described in
          this Privacy Policy.
        </p>

        <p>
          Users may request account
          deletion using available
          account settings or support
          mechanisms.
        </p>

        <p>
          Following a valid deletion
          request, applicable personal
          information will be deleted,
          anonymised or otherwise
          handled in accordance with
          applicable law and Unwind's
          technical and legal
          obligations.
        </p>

        <p>
          Certain information may remain
          temporarily in backups or may
          be retained where reasonably
          necessary or permitted for
          security, fraud and abuse
          prevention, dispute
          resolution, enforcement or
          legal compliance.
        </p>

        <p>
          Content that another user has
          independently copied,
          screenshotted, downloaded or
          otherwise retained may remain
          outside Unwind's control.
        </p>
      </>
    )
  },

  {
    number: "19",
    title:
      "Your Privacy Choices and Rights",
    icon: Scale,

    content: (
      <>
        <p>
          Privacy and data-protection
          rights vary depending on the
          jurisdiction in which you
          reside and the law applicable
          to the relevant processing.
        </p>

        <p>
          Where provided by applicable
          law, users may have rights to:
        </p>

        <ul>
          <li>
            Request information about
            personal information
            processed by Unwind.
          </li>

          <li>
            Access or obtain a copy of
            personal information.
          </li>

          <li>
            Correct inaccurate or
            incomplete information.
          </li>

          <li>
            Request deletion or erasure
            of personal information.
          </li>

          <li>
            Request restriction of
            certain processing.
          </li>

          <li>
            Object to certain
            processing.
          </li>

          <li>
            Withdraw consent where
            processing is based on
            consent.
          </li>

          <li>
            Request portability of
            information where the right
            applies.
          </li>

          <li>
            Opt out of certain forms of
            sale, sharing, targeted
            advertising or profiling
            where applicable.
          </li>

          <li>
            Appeal certain decisions
            concerning privacy requests
            where applicable law
            provides such a right.
          </li>

          <li>
            Lodge a complaint or
            grievance with an
            appropriate privacy,
            consumer or data-protection
            authority where permitted by
            law.
          </li>
        </ul>

        <p>
          Unwind will not unlawfully
          discriminate against users for
          exercising privacy rights
          protected by applicable law.
        </p>
      </>
    )
  },

  {
    number: "20",
    title:
      "How to Exercise Privacy Rights",
    icon: Mail,

    content: (
      <>
        <p>
          Privacy requests may be
          submitted through available
          account functionality or by
          contacting Unwind at:
        </p>

        <div className="terms-contact-box">
          <strong>
            projectunwind00@gmail.com
          </strong>
        </div>

        <p>
          Unwind may request information
          reasonably necessary to
          verify the identity and
          authority of the person making
          a request and to protect
          personal information against
          unauthorised disclosure or
          deletion.
        </p>

        <p>
          Where applicable law permits
          authorised representatives or
          agents to submit requests,
          Unwind may request reasonable
          evidence of their authority.
        </p>

        <p>
          Requests will be handled
          within the periods and subject
          to the exceptions provided by
          applicable law.
        </p>
      </>
    )
  },

  {
    number: "21",
    title:
      "Eligibility and Younger Users",
    icon: UserRoundCheck,

    content: (
      <>
        <p>
          Users must be legally eligible
          to use Unwind under applicable
          law and legally capable of
          agreeing to the applicable
          Terms.
        </p>

        <p>
          Where applicable law requires
          parental or guardian consent
          or other authorisation for a
          person's use of the Services
          or processing of personal
          information, the required
          authorisation must be obtained
          through an appropriate
          mechanism before the relevant
          processing occurs.
        </p>

        <p>
          If Unwind becomes aware that
          personal information has been
          collected in circumstances
          that do not comply with
          applicable age or consent
          requirements, reasonable steps
          may be taken to restrict the
          account, obtain legally
          required authorisation or
          delete the relevant
          information, as appropriate.
        </p>
      </>
    )
  },

  {
    number: "22",
    title:
      "Regional and Jurisdiction-Specific Requirements",
    icon: Globe2,

    content: (
      <>
        <p>
          Privacy laws differ between
          countries, states and regions.
          This Privacy Policy is
          intended to provide a general
          description of Unwind's
          personal-information
          practices while preserving
          additional rights and
          protections that may apply
          under local law.
        </p>

        <p>
          Where applicable law provides
          users with rights,
          restrictions, notices or
          protections that differ from
          or exceed those described in
          this Privacy Policy, Unwind
          will apply the legally
          required standard to the
          relevant processing.
        </p>

        <p>
          Nothing in this Privacy Policy
          is intended to waive or limit
          privacy, consumer or
          data-protection rights that
          cannot lawfully be waived or
          limited.
        </p>
      </>
    )
  },

  {
    number: "23",
    title:
      "Changes to This Privacy Policy",
    icon: FileText,

    content: (
      <>
        <p>
          This Privacy Policy may be
          updated when Unwind's
          features, third-party
          providers, security
          requirements, operations or
          legal obligations change.
        </p>

        <p>
          The current version will
          display its effective date and
          last-updated date.
        </p>

        <p>
          Where applicable law requires
          additional notice, renewed
          consent or another user choice
          for a material change, Unwind
          will provide the legally
          required mechanism.
        </p>
      </>
    )
  },

  {
    number: "24",
    title:
      "Contact, Privacy Requests and Grievances",
    icon: Mail,

    content: (
      <>
        <p>
          Questions concerning this
          Privacy Policy, privacy
          requests, security concerns,
          grievances or other
          data-protection enquiries may
          be directed to:
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
          Users submitting privacy
          requests or grievances should
          provide sufficient information
          for Unwind to identify and
          review the request.
        </p>

        <p>
          Additional verification may
          be requested where reasonably
          necessary to protect account
          security and personal
          information.
        </p>

        <p>
          Where applicable law provides
          a right to complain directly
          to a data-protection,
          consumer-protection or other
          competent regulatory
          authority, nothing in this
          Privacy Policy prevents a user
          from exercising that right.
        </p>
      </>
    )
  }
];

function PrivacyPage() {
  const navigate =
    useNavigate();

  return (
    <main className="terms-page">
      {/* ================================================
          NAVIGATION
      ================================================= */}

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

      {/* ================================================
          HERO
      ================================================= */}

      <header className="terms-hero">
        <div className="terms-hero__icon">
          <ShieldCheck
            size={28}
          />
        </div>

        <span className="terms-eyebrow">
          Privacy
        </span>

        <h1>
          Privacy Policy
        </h1>

        <p className="terms-hero__lead">
          This Privacy Policy explains
          what information Unwind may
          process, why it may be
          processed, how it may be
          protected and the privacy
          choices and rights that may
          apply to you.
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

      {/* ================================================
          PRIVACY NOTICE
      ================================================= */}

      <section className="terms-important">
        <LockKeyhole
          size={21}
        />

        <div>
          <strong>
            Your personal information
          </strong>

          <p>
            Unwind aims to process
            personal information only
            for legitimate and disclosed
            purposes associated with
            operating, securing and
            providing the platform,
            subject to applicable
            privacy and data-protection
            law.
          </p>
        </div>
      </section>

      {/* ================================================
          INTRODUCTION
      ================================================= */}

      <section className="terms-intro">
        <p>
          This Privacy Policy describes
          how personal information may
          be collected, used, stored,
          processed, transmitted,
          retained, protected and
          deleted when you access or use
          Unwind. The exact information
          processed depends on the
          features you choose to use,
          your interactions with the
          platform and applicable legal
          requirements.
        </p>
      </section>

      {/* ================================================
          POLICY SECTIONS
      ================================================= */}

      <div className="terms-content">
        {privacySections.map(
          ({
            number,
            title,
            icon: Icon,
            content
          }) => (
            <article
              key={number}
              className="terms-section"
              id={`privacy-${number}`}
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

      {/* ================================================
          REGISTRATION ACKNOWLEDGEMENT
      ================================================= */}

      <section className="terms-acceptance">
        <div className="terms-acceptance__icon">
          <ShieldCheck
            size={24}
          />
        </div>

        <div>
          <span>
            Registration acknowledgement
          </span>

          <h2>
            Privacy and your UNWIND
            account
          </h2>

          <p>
            When registering for Unwind,
            users are asked to
            acknowledge this Privacy
            Policy together with
            acceptance of the Terms and
            Conditions.
          </p>

          <blockquote>
            “I have read and agree to the
            Unwind Terms and Conditions
            and acknowledge the Privacy
            Policy.”
          </blockquote>

          <p>
            Acknowledging this Privacy
            Policy does not by itself
            constitute consent to every
            form of personal-data
            processing. Where applicable
            law requires separate,
            specific or explicit
            consent, Unwind will provide
            an appropriate consent
            mechanism.
          </p>
        </div>
      </section>

      {/* ================================================
          FOOTER
      ================================================= */}

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

export default PrivacyPage;

