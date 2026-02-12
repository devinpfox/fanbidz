'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50/30 to-purple-50/20">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-white/20">
        <div className="h-16 max-w-3xl mx-auto flex items-center px-6 gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg p-8 space-y-8">

          <div className="text-center pb-4 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-gray-500 mt-2">Last updated: February 12, 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Fanbids ("we," "our," or "us"). Fanbids is an adult marketplace platform that enables content creators to auction and sell personal items, including used garments, to their fans. We are committed to protecting your personal information and your right to privacy.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Given the intimate nature of our marketplace, we take extra care to protect the privacy of both Creators and Buyers.
            </p>
            <p className="text-gray-700 leading-relaxed font-medium">
              By using Fanbids, you confirm that you are at least 18 years old and consent to our data practices as described in this policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-gray-800">2.1 Account Information</h3>
            <p className="text-gray-700 leading-relaxed">When you register, we collect:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Email address and password</li>
              <li>Username and display name</li>
              <li>Profile photo (optional)</li>
              <li>Bio and website links (optional)</li>
              <li>Age verification confirmation</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800">2.2 Creator Information</h3>
            <p className="text-gray-700 leading-relaxed">If you register as a Creator/Seller, we additionally collect:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Payout information (bank account or payment processor details)</li>
              <li>Tax identification information where required by law</li>
              <li>Identity verification documents (processed securely)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800">2.3 Transaction Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Purchase and sales history</li>
              <li>Bidding activity</li>
              <li>Shipping addresses (Buyers)</li>
              <li>Return addresses (Creators)</li>
              <li>Communication between Buyers and Creators</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800">2.4 Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Device information and browser type</li>
              <li>IP address and approximate location</li>
              <li>Usage patterns and preferences</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Create and manage your account</li>
              <li>Verify your age and identity</li>
              <li>Process transactions and facilitate auctions</li>
              <li>Enable communication between Creators and Buyers</li>
              <li>Provide shipping labels and tracking</li>
              <li>Process Creator payouts</li>
              <li>Send transaction confirmations and updates</li>
              <li>Respond to support requests</li>
              <li>Detect and prevent fraud, abuse, and policy violations</li>
              <li>Comply with legal obligations</li>
              <li>Improve and personalize your experience</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">4. Creator Privacy Protection</h2>
            <p className="text-gray-700 leading-relaxed">
              We understand that Creators may wish to maintain separation between their online persona and personal identity. We offer the following protections:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Anonymous Shipping:</strong> Creators can use our shipping label service to avoid revealing their personal address</li>
              <li><strong>Display Names:</strong> Your legal name is never shown publicly; only your chosen username appears</li>
              <li><strong>Private Payouts:</strong> Financial information is never shared with Buyers</li>
              <li><strong>Secure Messaging:</strong> All communications occur within our platform</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">5. Information Sharing</h2>
            <p className="text-gray-700 leading-relaxed">We share your information only as follows:</p>

            <h3 className="text-lg font-medium text-gray-800">5.1 Between Users</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Buyers see Creator usernames, profile info, and listing details</li>
              <li>Creators see Buyer usernames and shipping addresses (for fulfilled orders only)</li>
              <li>Neither party sees the other's email, phone, or payment details</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800">5.2 With Service Providers</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Shipping Partners:</strong> Label generation and tracking</li>
              <li><strong>Supabase:</strong> Database and authentication</li>
              <li><strong>Vercel:</strong> Hosting services</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800">5.3 Legal Requirements</h3>
            <p className="text-gray-700 leading-relaxed">
              We may disclose information when required by law, court order, or to protect the safety of our users or the public.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">6. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              Given the sensitive nature of our platform, we implement robust security measures:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>End-to-end encryption for sensitive data</li>
              <li>Secure, encrypted database storage</li>
              <li>Regular security audits and penetration testing</li>
              <li>Two-factor authentication option</li>
              <li>Automatic session timeouts</li>
              <li>PCI-compliant payment processing</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              While we take extensive precautions, no system is 100% secure. We encourage you to use strong passwords and enable all available security features.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">7. Data Retention</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Account data is retained while your account is active</li>
              <li>Transaction records are kept for 7 years (tax/legal compliance)</li>
              <li>You may request account deletion at any time</li>
              <li>Upon deletion, personal data is removed within 30 days, except where retention is legally required</li>
              <li>Shipping addresses are deleted 90 days after delivery confirmation</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">8. Your Privacy Rights</h2>
            <p className="text-gray-700 leading-relaxed">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correct:</strong> Update inaccurate information</li>
              <li><strong>Delete:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Receive your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing emails</li>
              <li><strong>Restrict:</strong> Limit certain processing of your data</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              To exercise these rights, contact us at privacy@fanbids.com with your request.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">9. Cookies</h2>
            <p className="text-gray-700 leading-relaxed">We use cookies to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Analyze site usage</li>
              <li>Prevent fraud</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You can manage cookies through your browser settings. Disabling cookies may affect platform functionality.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">10. Age Restriction</h2>
            <p className="text-gray-700 leading-relaxed">
              Fanbids is strictly for users 18 years of age or older. We do not knowingly collect information from anyone under 18. If we discover that a user is under 18, we will immediately terminate their account and delete all associated data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">11. International Users</h2>
            <p className="text-gray-700 leading-relaxed">
              Your data may be processed in the United States. By using Fanbids, you consent to the transfer of your information to the U.S., where data protection laws may differ from your country.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">12. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this policy periodically. We will notify you of material changes via email or platform notification. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">13. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For privacy-related questions or to exercise your rights:
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-gray-700">
              <p><strong>Fanbids Privacy Team</strong></p>
              <p>Email: privacy@fanbids.com</p>
              <p>Support: support@fanbids.com</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
