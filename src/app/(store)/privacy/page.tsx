import type { Metadata } from "next";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read Pick Plant's Privacy Policy to understand how we collect, use, and protect your personal information when you shop with us.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="py-10 sm:py-16 bg-[#F7F8F5] min-h-[calc(100vh-14rem)]">
      <Container>
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <header className="mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1E5A3A]">
              Legal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[#1F2D22] sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm text-[#66746A]">
              Last updated: August 2026
            </p>
          </header>

          {/* Policy Body */}
          <div className="space-y-8">
            <Section title="1. Introduction">
              <p>
                Welcome to Pick Plant (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We operate the website{" "}
                <strong>pick-plant.vercel.app</strong> and are committed to
                protecting your personal information and your right to privacy.
                This Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you visit our website or place an
                order with us.
              </p>
            </Section>

            <Section title="2. Information We Collect">
              <p>We may collect the following categories of personal information:</p>
              <ul>
                <li>
                  <strong>Account information</strong>: name, email address, and
                  password when you create an account.
                </li>
                <li>
                  <strong>Order information</strong>: shipping address, phone
                  number, and payment details when you place an order.
                </li>
                <li>
                  <strong>Usage data</strong>: pages visited, browser type,
                  referring URLs, and device information collected automatically.
                </li>
                <li>
                  <strong>Communications</strong>: messages you send us via
                  contact forms or email.
                </li>
              </ul>
            </Section>

            <Section title="3. How We Use Your Information">
              <p>We use the information we collect to:</p>
              <ul>
                <li>Process and fulfil your orders and deliver plants to you.</li>
                <li>Manage your account and send transactional emails.</li>
                <li>Respond to your inquiries and provide customer support.</li>
                <li>
                  Improve our website, products, and services through analytics.
                </li>
                <li>
                  Send you marketing communications if you have opted in (you may
                  unsubscribe at any time).
                </li>
                <li>Comply with legal obligations.</li>
              </ul>
            </Section>

            <Section title="4. Sharing Your Information">
              <p>
                We do not sell your personal information. We may share your
                information with trusted third-party service providers who assist
                us in operating our website and fulfilling orders, including:
              </p>
              <ul>
                <li>Payment processors (e.g., SSLCommerz, bKash).</li>
                <li>Delivery and logistics partners.</li>
                <li>
                  Cloud infrastructure and analytics providers (e.g., Vercel,
                  Google Analytics).
                </li>
              </ul>
              <p>
                All third parties are contractually required to keep your
                information confidential and to use it only for the services they
                provide to us.
              </p>
            </Section>

            <Section title="5. Cookies">
              <p>
                We use cookies and similar tracking technologies to enhance your
                browsing experience, remember your cart, and analyse site traffic.
                You can control cookie settings through your browser. Disabling
                cookies may affect the functionality of certain features.
              </p>
            </Section>

            <Section title="6. Data Retention">
              <p>
                We retain your personal information for as long as necessary to
                provide our services and comply with our legal obligations.
                Account data is retained until you request deletion. Order
                records may be retained for up to 7 years for accounting and
                legal purposes.
              </p>
            </Section>

            <Section title="7. Your Rights">
              <p>
                Depending on your location, you may have the right to:
              </p>
              <ul>
                <li>Access the personal information we hold about you.</li>
                <li>Request correction of inaccurate data.</li>
                <li>Request deletion of your personal data.</li>
                <li>Object to or restrict the processing of your data.</li>
                <li>Withdraw consent at any time where processing is consent-based.</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at{" "}
                <a
                  href="mailto:support@pickplant.com"
                  className="font-semibold text-[#1E5A3A] hover:underline"
                >
                  support@pickplant.com
                </a>
                .
              </p>
            </Section>

            <Section title="8. Security">
              <p>
                We implement appropriate technical and organisational measures to
                protect your personal information against unauthorised access,
                alteration, disclosure, or destruction. However, no internet
                transmission is completely secure, and we cannot guarantee
                absolute security.
              </p>
            </Section>

            <Section title="9. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. The
                &quot;Last updated&quot; date at the top of this page indicates when the
                most recent revision was made. We encourage you to review this
                policy periodically.
              </p>
            </Section>

            <Section title="10. Contact Us">
              <p>
                If you have any questions or concerns about this Privacy Policy,
                please contact us:
              </p>
              <address className="not-italic mt-3 space-y-1 text-sm">
                <p>
                  <strong>Pick Plant</strong>
                </p>
                <p>House 42, Road 11, Block D, Banani, Dhaka-1213, Bangladesh</p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:support@pickplant.com"
                    className="font-semibold text-[#1E5A3A] hover:underline"
                  >
                    support@pickplant.com
                  </a>
                </p>
                <p>Phone: +880 1700-000000</p>
              </address>
            </Section>
          </div>
        </div>
      </Container>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-[18px] border border-[#DDE7DD] p-6 sm:p-8 shadow-[0_4px_16px_rgba(31,45,34,0.04)]">
      <h2 className="text-base font-bold text-[#1F2D22] sm:text-lg mb-4">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-[#3D4F43] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-[#1E5A3A] [&_a:hover]:underline">
        {children}
      </div>
    </section>
  );
}
