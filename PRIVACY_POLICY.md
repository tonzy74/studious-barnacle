# Privacy Policy

**Last Updated:** March 25, 2026

## 1. Introduction

This Privacy Policy describes how the JobPilot application ("the App", "we", "our") collects, uses, and protects your personal information. By using the App, you agree to the practices described in this policy.

## 2. Information We Collect

### Information You Provide
- **OAuth Profile Data**: When you authenticate via OAuth (currently LinkedIn as the provider), we receive your name, email address, headline, location, profile picture URL, and OAuth ID as authorized by the provider's API.
- **Search Criteria**: Job titles, preferred locations, salary preferences, and other search filters you configure.
- **Job Interaction Data**: Your approve/reject decisions on job listings.

### Information From Third-Party Job APIs
- We query public job board APIs (RemoteOK, Arbeitnow, and The Muse) on your behalf. Job listing data retrieved from these services is stored temporarily to display results and track your application pipeline.

### Automatically Collected Information
- Session tokens for authentication purposes.
- We do not collect analytics, tracking data, browser fingerprints, or IP addresses for profiling.

## 3. How We Use Your Information

We use your information solely to:
- Authenticate you via OAuth.
- Search for job listings matching your criteria across supported job boards.
- Score and rank job listings based on your profile and preferences.
- Display your job pipeline and application history.

We do **not**:
- Sell, rent, or share your personal information with third parties.
- Use your data for advertising or marketing purposes.
- Automatically apply to jobs on your behalf.
- Scrape, crawl, or access any platform in violation of its terms of service.

## 4. Data Storage and Security

- All data is stored locally in a SQLite database on the server where the App is deployed.
- Sensitive data (session tokens, encryption keys) is encrypted at rest using Fernet symmetric encryption.
- Passwords and secrets are never stored in plaintext.
- HTTPS is required for all communications in production.
- CSRF protection, rate limiting, and input sanitization are enforced on all endpoints.

## 5. Data Retention

- Job listings and interaction data are retained as long as your account exists.
- Session data expires after 24 hours.
- You may request deletion of all your data at any time (see Section 9).

## 6. Third-Party Services

The App integrates with the following third-party services via their official public APIs:

| Service | Data Shared | Purpose |
|---------|-------------|---------|
| **OAuth Provider (LinkedIn)** | OAuth tokens (not stored long-term) | User authentication |
| **RemoteOK API** | Search queries (job titles) | Job search |
| **Arbeitnow API** | Search queries (job titles) | Job search |
| **The Muse API** | Search queries (job categories, location) | Job search |

Each third-party service is governed by its own privacy policy and terms of service. We encourage you to review them.

## 7. Cookies and Tracking

The App uses only essential session cookies for authentication. We do not use:
- Third-party tracking cookies
- Analytics services
- Advertising pixels or beacons

## 8. Children's Privacy

The App is not intended for use by individuals under the age of 16. We do not knowingly collect personal information from children.

## 9. Your Rights

You have the right to:
- **Access** your personal data stored by the App.
- **Correct** inaccurate information in your profile.
- **Delete** your account and all associated data.
- **Export** your data in a machine-readable format.
- **Withdraw consent** at any time by discontinuing use of the App.

To exercise any of these rights, contact the App administrator.

## 10. Disclaimer of Liability

THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW:

- **The App operator shall not be liable** for any direct, indirect, incidental, special, consequential, or punitive damages arising from or related to your use of the App.
- **The App operator shall not be liable** for the accuracy, completeness, or reliability of job listings retrieved from third-party APIs. Job data is provided by third-party services and may be inaccurate, outdated, or incomplete.
- **The App operator shall not be liable** for any employment decisions, missed opportunities, or outcomes resulting from the use of the App.
- **The App operator shall not be liable** for any actions taken by third-party services, including but not limited to changes to their APIs, terms of service, or data availability.
- **The App operator shall not be liable** for any unauthorized access to or alteration of your data, except where caused by gross negligence on the part of the App operator.
- **You acknowledge** that you are solely responsible for verifying job listings, application details, and any information before taking action.
- **You acknowledge** that the confidence scores and job rankings provided by the App are algorithmic estimates and do not guarantee job fit, interview outcomes, or employment.
- **You assume all risk** associated with the use of the App and agree to hold the App operator harmless from any claims, losses, or damages arising from your use.

## 11. Indemnification

You agree to indemnify, defend, and hold harmless the App operator from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable legal fees) arising out of or in connection with your use of the App, your violation of this Privacy Policy, or your violation of any rights of a third party.

## 12. Limitation of Liability

IN NO EVENT SHALL THE TOTAL LIABILITY OF THE APP OPERATOR EXCEED THE AMOUNT YOU PAID TO USE THE APP IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ZERO DOLLARS ($0.00) IF THE APP IS PROVIDED FREE OF CHARGE.

## 13. Governing Law

This Privacy Policy shall be governed by and construed in accordance with the laws of the jurisdiction in which the App operator resides, without regard to conflict of law principles.

## 14. Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be posted within the App or repository. Continued use of the App after changes constitutes acceptance of the updated policy.

## 15. Contact

For privacy-related inquiries, data deletion requests, or concerns, please open an issue in this repository or contact the App administrator directly.
