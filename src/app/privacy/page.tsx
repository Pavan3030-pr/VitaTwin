import type { Metadata } from "next";
import { CONTACT, LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <section>
        <h2>The short version</h2>
        <p>
          VitaTwin is a proof of concept. Every patient you see is synthetic, and the app is not
          designed to receive real health records. We collect as little as we can, never sell data,
          and you can delete your account at any time.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account details</strong> (only if you create an email account): your email
            address and a password. Passwords are handled by Supabase Auth and stored as salted
            hashes; we cannot read them.
          </li>
          <li>
            <strong>Profile and saved twin snapshots</strong> linked to your account, protected by
            row-level security so only you can read them.
          </li>
          <li>
            <strong>Files you import</strong> (FHIR bundles or wearable CSVs) are analysed and
            discarded. They are not stored or logged. Please do not upload real patient data.
          </li>
          <li>
            <strong>Basic usage analytics</strong> through Vercel Web Analytics: page views and
            device type, in aggregate. It does not use cookies and does not follow you across sites.
          </li>
          <li>
            <strong>Error reports</strong>: when something breaks we log the error type and page. Emails,
            tokens and long numbers are removed before anything is recorded.
          </li>
        </ul>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          We use only strictly necessary cookies: your sign-in session, the demo-session flag, your
          selected synthetic patient, and a flag that remembers you finished the welcome tour. We
          use no advertising or tracking cookies.
        </p>
      </section>

      <section>
        <h2>Who processes your data</h2>
        <ul>
          <li>Supabase: authentication and database.</li>
          <li>Vercel: hosting and aggregate analytics.</li>
          <li>Open-Meteo: live air-quality and heat data. Only a city name is sent, never your identity.</li>
        </ul>
      </section>

      <section>
        <h2>Your choices</h2>
        <ul>
          <li>
            <strong>Delete your account</strong> from the Account page. Your profile and saved
            snapshots are removed immediately and permanently.
          </li>
          <li>Ask us what we hold about you, or to correct it, using the contact below.</li>
          <li>
            If you are in India, you may exercise your rights as a data principal under the Digital
            Personal Data Protection Act, 2023.
          </li>
        </ul>
      </section>

      <section>
        <h2>Retention and security</h2>
        <p>
          Data is kept until you delete your account. Traffic is encrypted in transit, secrets stay
          on the server, and access to stored data is limited by row-level security.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          {CONTACT ? (
            <>
              Questions or requests: <a className="font-medium text-primary-strong underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>
            </>
          ) : (
            <>Questions or requests: please open an issue on the project&rsquo;s GitHub repository.</>
          )}
        </p>
      </section>
    </LegalPage>
  );
}
