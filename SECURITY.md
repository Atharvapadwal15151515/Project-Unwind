# Security Policy

Security and privacy are core requirements of **Unwind**, a privacy-first mental wellness and self-care platform. We appreciate responsible reports from security researchers, developers, and users who help us protect the community.

This document explains which versions are supported, how to report vulnerabilities privately, what information to include, and what researchers can expect from the Unwind team.

## Supported Versions

Unwind is under active development. Security updates are applied only to the latest code on the default branch and the current production deployment.

| Version | Supported |
| --- | --- |
| Latest `main` branch | Yes |
| Current production deployment | Yes |
| Older commits, forks, and archived builds | No |
| Modified third-party deployments | No |

Before reporting a problem, please verify that it is still reproducible on the latest supported version when doing so can be performed safely.

## Reporting a Vulnerability

**Do not report security vulnerabilities in public GitHub issues, discussions, pull requests, social media posts, or community chats.** Public disclosure before a fix is available could place Unwind users at risk.

Use GitHub's private vulnerability reporting feature:

1. Open the Unwind repository on GitHub.
2. Select **Security**.
3. Select **Advisories**.
4. Select **Report a vulnerability**.

If private reporting is temporarily unavailable, contact a repository maintainer through their GitHub profile and request a private reporting channel. Do not include exploit details, credentials, personal data, or proof-of-concept code in a public message.

### Include the following information

- A clear description of the vulnerability.
- The affected page, endpoint, component, or commit.
- Reproduction steps using a test account and non-sensitive data.
- The security impact and realistic attack scenario.
- Relevant request and response details with credentials removed.
- Screenshots, logs, or proof-of-concept code when necessary.
- Suggested remediation, if known.
- Whether the vulnerability may already have been exploited or disclosed.

Please remove or redact access tokens, refresh tokens, cookies, API keys, passwords, OTPs, journal content, DASS-21 results, email addresses, and other personal information before submitting a report.

## Response Targets

Unwind is maintained by a small student development team. We will make a good-faith effort to meet the following targets:

| Stage | Target |
| --- | --- |
| Acknowledge the report | Within 72 hours |
| Initial validation and severity assessment | Within 7 days |
| Status updates for confirmed reports | At least every 14 days |
| Critical vulnerability remediation | As soon as possible, ideally within 7 days |
| High-severity vulnerability remediation | Ideally within 30 days |
| Moderate or low-severity remediation | Based on impact and release planning |

These are response goals rather than guaranteed service-level agreements. Complex vulnerabilities or third-party dependency issues may require additional time.

We may ask for clarification or additional evidence. Reports that cannot be reproduced may be closed, but they can be reopened if new information becomes available.

## Vulnerabilities of Particular Interest

We especially welcome reports concerning:

- Authentication, authorization, or session-management bypasses.
- Account takeover or privilege escalation.
- Exposure of journal entries, DASS-21 results, wellness records, private messages, or profile information.
- Cross-user or cross-room data access.
- Broken object-level authorization in API endpoints.
- Administrative access-control failures.
- JWT, refresh-token, cookie, OAuth, OTP, or password-reset weaknesses.
- SQL injection, command injection, or server-side request forgery.
- Stored or reflected cross-site scripting.
- Cross-site request forgery with meaningful impact.
- Unsafe file uploads or access to another user's attachments.
- WebSocket or Socket.IO authorization failures.
- Secrets exposed in source code, builds, logs, or responses.
- Rate-limit bypasses affecting authentication, messaging, or resource usage.
- Dependency vulnerabilities that are exploitable in Unwind's supported configuration.

## Generally Out of Scope

The following issues are normally not eligible unless they demonstrate a concrete security impact:

- Automated scanner output without validation or reproduction steps.
- Missing headers or security best practices without an exploitable consequence.
- Self-XSS requiring users to paste code into developer tools.
- Clickjacking on pages that perform no sensitive action.
- Rate-limit observations that do not create a meaningful availability or security risk.
- Username or email enumeration without additional impact.
- Logout CSRF without additional impact.
- Social engineering, phishing, spam, or physical attacks.
- Denial-of-service, volumetric testing, or resource-exhaustion testing.
- Vulnerabilities that require a compromised device, browser, or account.
- Issues affecting unsupported browsers, old commits, forks, or modified deployments.
- Reports based only on outdated dependency version numbers without demonstrating reachability or exploitability.
- Content-quality disagreements, AI hallucinations, or non-security product feedback.

## Rules for Responsible Testing

By researching Unwind, you agree to:

- Test only accounts and data that you own or have explicit permission to use.
- Use the minimum number of requests needed to demonstrate the issue.
- Avoid accessing, changing, downloading, retaining, or deleting another person's data.
- Stop testing immediately if you encounter real user information.
- Never test using genuine mental-health information or crisis disclosures.
- Avoid disrupting production, degrading service, or affecting other users.
- Not perform denial-of-service testing, credential stuffing, brute-force attacks, spam, or social engineering.
- Not upload malware or execute code on infrastructure beyond what is strictly required to establish impact.
- Not attempt to obtain persistence or move laterally within infrastructure.
- Keep vulnerability details confidential until the Unwind team confirms that disclosure is safe.
- Securely delete any data unintentionally collected during research.
- Comply with applicable laws and the terms of the services on which Unwind depends.

If testing could affect production data or availability, stop and request written authorization before continuing.

## Sensitive Data and Privacy

Unwind may process information related to emotional well-being. Treat all user-generated content and wellness information as highly sensitive, including:

- Journal entries and attachments.
- DASS-21 answers, scores, classifications, and reports.
- Mood, sleep, energy, water, activity, and habit records.
- AI companion conversations.
- Community posts, room messages, and direct messages.
- Account, profile, session, notification, and moderation information.

Do not include real user data in reports. If a small fragment is essential to demonstrate a vulnerability, redact it as much as possible and explain why it was necessary.

## Handling Exposed Credentials

If you discover an exposed secret, do not use it beyond the minimum safe validation necessary. Report its location privately and immediately.

Examples include:

- Database connection strings.
- JWT or cookie secrets.
- OAuth client secrets.
- Email-service credentials.
- Cloud hosting or storage credentials.
- Analytics credentials with write or administrative access.
- AI provider keys.
- User access tokens, refresh tokens, cookies, OTPs, or passwords.

Do not paste the complete secret into the report. Include only a short redacted fingerprint that allows the maintainers to identify it.

## Disclosure Process

For confirmed vulnerabilities, the Unwind team will generally:

1. Validate the report and assess its severity.
2. Contain the risk, including rotating credentials or disabling affected functionality when required.
3. Develop and test a remediation.
4. Deploy the fix to the supported production version.
5. Coordinate disclosure with the reporter when appropriate.
6. Publish a GitHub Security Advisory when publication would help users or downstream maintainers.

Please allow reasonable time for remediation before public disclosure. The reporter and Unwind team should agree on a disclosure date whenever possible.

## Recognition

With the reporter's permission, Unwind may acknowledge valid contributions in a security advisory, release note, or contributor record. We do not currently operate a paid bug-bounty program and cannot promise financial rewards.

## Safe-Harbor Intent

The Unwind team supports good-faith security research that follows this policy. We will not intentionally pursue action against researchers for accidental, reasonable violations made while acting in good faith, provided they promptly stop, report the issue, avoid privacy violations and disruption, and cooperate with remediation.

This statement does not authorize testing of third-party services, infrastructure, or accounts and cannot bind third parties or law-enforcement authorities.

## Security Is a Shared Responsibility

For general security improvements that do not involve a vulnerability, open a normal GitHub issue without including sensitive details. For suspected vulnerabilities, always use the private reporting process above.

Thank you for helping keep Unwind safe, private, and supportive.
