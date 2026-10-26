# Branded authentication email setup

Supabase Auth creates accounts and sends email-confirmation links to the callback page. The Vercel `/api/auth/welcome?action=email-code` endpoint sends child sign-in passcodes and password-recovery codes through Resend. Welcome and guardian-consent messages also use the Idilewa Resend integration. Supabase-generated confirmation and other Auth emails use the branded templates declared in `supabase/config.toml`.

## Database deployment order

Apply the repository's pending Supabase migrations before deploying the application. In particular, child sign-in checks `child_guardian_is_approved()`, and parent/educator dashboards require the educator-consent tables and RPCs. Deploying the application before those migrations are applied can prevent child sign-in and make the dashboards unavailable.

Link the Supabase CLI to the Idilewa project, inspect the pending migrations, then apply them with `supabase db push`. Do not link or push against a different project.

To have authentication messages arrive from Idilewa rather than the default Supabase sender:

1. Verify the Idilewa sending domain in Resend and ensure the configured `RESEND_FROM_EMAIL` address is authorized.
2. In the Supabase project, open **Authentication → SMTP Settings**, enable custom SMTP, and configure Resend:
   - Host: `smtp.resend.com`
   - Port: `465` (or the port recommended by Resend)
   - Username: `resend`
   - Password: the Resend API key, entered directly in Supabase and never committed to this repository
   - Sender name: `Idilewa`
   - Sender email: the verified Idilewa address used by `RESEND_FROM_EMAIL`
3. Deploy `public/assets/idilewa-email-logo.png` to `https://www.idilewa.com/assets/idilewa-email-logo.png` before enabling the confirmation template. Preview the auth-template changes with `supabase config diff --project-ref <project-ref>`. The confirmation email uses Supabase's `{{ .ConfirmationURL }}` link, which returns through `/auth-callback.html` and establishes the PKCE session.
4. Apply the reviewed template settings with `supabase config push --project-ref <project-ref>`. This project config declares only the four email templates; it does not configure or replace SMTP credentials.
5. Keep email confirmation enabled. The sign-up screen handles both confirmation-required accounts and projects configured to return an immediate session; production should require email confirmation.
6. Send a test sign-up, email-code sign-in, and password-reset message to confirm sender authentication, branding, and delivery.

The SMTP and template settings live in the Supabase Auth project configuration; Vercel environment variables alone do not change them. Ordinary password sign-in does not send an email notification. Child sign-in and password-recovery codes use the configured Resend API sender and are subject to Supabase Auth code expiration and the `auth_email_code` rate limits. Email/password sign-up confirmation is delivered by Supabase SMTP and can be resent from the sign-in page.
