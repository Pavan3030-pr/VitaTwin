import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <section>
        <h2>1. What VitaTwin is</h2>
        <p>
          VitaTwin is a proof of concept built for the Digital Twin Challenge 2026. It demonstrates
          how wearable signals and health records could be combined into a risk-aware digital twin.
          By using it you agree to these terms.
        </p>
      </section>

      <section>
        <h2>2. Not medical advice</h2>
        <p>
          VitaTwin is decision-support research software. It is <strong>not a medical device</strong>,
          does not diagnose, treat or prevent any condition, and must not be used for medical
          decisions. If you have a health concern, speak to a qualified clinician. In an emergency,
          call your local emergency number.
        </p>
      </section>

      <section>
        <h2>3. Synthetic data only</h2>
        <p>
          All patients shown are generated. Do not upload real personal health information. If you
          do, you do so at your own risk and you confirm you have the right to share it.
        </p>
      </section>

      <section>
        <h2>4. Your account</h2>
        <ul>
          <li>Keep your password confidential; you are responsible for activity on your account.</li>
          <li>Provide an accurate email address and do not share your account.</li>
          <li>You can delete your account at any time from the Account page.</li>
        </ul>
      </section>

      <section>
        <h2>5. Acceptable use</h2>
        <p>
          Do not attempt to break, overload or probe the service, bypass rate limits, access other
          people&rsquo;s data, or use it for anything unlawful. We may suspend access that harms the
          service or other users.
        </p>
      </section>

      <section>
        <h2>6. No warranty</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; without warranties of any kind. Risk scores come
          from published equations applied to synthetic inputs and may be wrong. To the extent the
          law allows, we are not liable for losses arising from use of the service.
        </p>
      </section>

      <section>
        <h2>7. Changes and law</h2>
        <p>
          We may update these terms; the date above shows the latest version. They are governed by
          the laws of India. See also our <Link className="font-medium text-primary-strong underline" href="/privacy">Privacy policy</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
