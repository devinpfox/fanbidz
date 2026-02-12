'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-lg p-8 space-y-8">

          <div className="text-center pb-4 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-gray-500 mt-2">Last updated: February 12, 2026</p>
          </div>

          <section className="space-y-4 bg-pink-50 rounded-xl p-4 border border-pink-200">
            <h2 className="text-lg font-semibold text-pink-800">Adult Content Notice</h2>
            <p className="text-pink-700 leading-relaxed">
              Fanbids is an adult marketplace platform. By using this service, you confirm that you are at least 18 years old and legally permitted to view and purchase adult-oriented items in your jurisdiction. This platform contains content intended for mature audiences only.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Fanbids. These Terms of Service ("Terms") govern your access to and use of the Fanbids platform, which enables adult content creators to auction and sell personal items, including used garments, to their fans.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using Fanbids, you agree to be bound by these Terms. If you do not agree, you may not use the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">2. Eligibility</h2>
            <p className="text-gray-700 leading-relaxed">To use Fanbids, you must:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Be at least 18 years old</strong> (or the age of majority in your jurisdiction, whichever is higher)</li>
              <li>Have the legal capacity to enter into binding agreements</li>
              <li>Not be prohibited from using adult services under applicable law</li>
              <li>Provide accurate registration information</li>
              <li>Reside in a jurisdiction where purchasing adult items is legal</li>
            </ul>
            <p className="text-gray-700 leading-relaxed font-medium">
              By creating an account, you represent and warrant that you meet ALL eligibility requirements. We reserve the right to verify your age and may terminate accounts that fail verification.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">3. Account Types</h2>

            <h3 className="text-lg font-medium text-gray-800">3.1 Buyer Accounts</h3>
            <p className="text-gray-700 leading-relaxed">
              Buyer accounts allow you to browse listings, place bids, make purchases, and communicate with Creators.
            </p>

            <h3 className="text-lg font-medium text-gray-800">3.2 Creator Accounts</h3>
            <p className="text-gray-700 leading-relaxed">
              Creator accounts allow you to list items for sale, conduct auctions, and receive payments. Creators must:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Complete identity verification</li>
              <li>Provide valid payout information</li>
              <li>Agree to Creator-specific guidelines</li>
              <li>Be the rightful owner of all items listed</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">4. Platform Services</h2>
            <p className="text-gray-700 leading-relaxed">
              Fanbids provides a marketplace for Creators to sell personal items to Buyers. We facilitate:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Item listings with photos and descriptions</li>
              <li>Timed auctions with bidding</li>
              <li>Buy Now instant purchases</li>
              <li>Secure payment processing</li>
              <li>In-platform messaging between Buyers and Creators</li>
              <li>Shipping label generation and tracking</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              <strong>Fanbids is a platform provider only.</strong> We are not a party to transactions between Buyers and Creators. We do not own, inspect, or guarantee any items sold.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">5. Permitted Items</h2>
            <p className="text-gray-700 leading-relaxed">Creators may list the following types of items:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Used clothing and garments (lingerie, underwear, socks, hosiery, activewear, etc.)</li>
              <li>Worn accessories (jewelry, hair accessories, etc.)</li>
              <li>Personal items that have been used/worn by the Creator</li>
              <li>Autographed merchandise</li>
              <li>Exclusive or limited creator merchandise</li>
              <li>Polaroids, prints, or physical media (non-explicit)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">6. Prohibited Items & Content</h2>
            <p className="text-gray-700 leading-relaxed">The following are strictly prohibited:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Items from anyone other than the Creator themselves</li>
              <li>Items depicting or involving minors in any way</li>
              <li>Bodily fluids, waste, or biological materials</li>
              <li>Explicit photos or videos (this is an item marketplace, not content platform)</li>
              <li>Weapons, ammunition, or explosives</li>
              <li>Drugs, drug paraphernalia, or controlled substances</li>
              <li>Counterfeit or stolen items</li>
              <li>Items that promote violence, hate, or discrimination</li>
              <li>Any items illegal in the U.S. or recipient's jurisdiction</li>
              <li>Services or experiences (items only)</li>
              <li>Live animals or human remains</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              Violations will result in immediate account termination and may be reported to law enforcement.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">7. Listing Guidelines</h2>
            <p className="text-gray-700 leading-relaxed">All listings must:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Accurately describe the item being sold</li>
              <li>Include clear, authentic photos of the actual item</li>
              <li>Specify the item's condition (new, worn, duration worn, etc.)</li>
              <li>Not contain explicit nudity in listing photos</li>
              <li>Not make false claims about the item's history or provenance</li>
              <li>Comply with all applicable laws</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800">7.1 Wear Time & Condition</h3>
            <p className="text-gray-700 leading-relaxed">
              Creators should accurately represent how long items were worn and their condition. Misrepresenting wear time or condition is grounds for refunds and account penalties.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">8. Auction Rules</h2>

            <h3 className="text-lg font-medium text-gray-800">8.1 Bidding</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>All bids are binding and cannot be withdrawn</li>
              <li>Bids are placed using Fanbids coins (virtual currency)</li>
              <li>You must have sufficient coins to place a bid</li>
              <li>Coins are held in escrow until auction completion</li>
              <li>The highest bidder at auction end wins</li>
              <li>Outbid coins are returned to your wallet immediately</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800">8.2 Buy Now</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Buy Now allows immediate purchase at a set price</li>
              <li>Buy Now ends the auction instantly</li>
              <li>Existing bidders are notified and refunded</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800">8.3 Winning & Payment</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Winning bidders must complete the transaction</li>
              <li>Coins are automatically deducted upon winning</li>
              <li>Failure to complete purchases may result in account suspension</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">9. Fanbids Coins</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Coins are purchased with real currency via Stripe</li>
              <li>Coins have no cash value and are non-refundable once purchased</li>
              <li>Coins are non-transferable between accounts</li>
              <li>Creators receive coins for sales, convertible to cash via payout</li>
              <li>We reserve the right to modify coin pricing and conversion rates</li>
              <li>Unused coins remain in your account indefinitely</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">10. Creator Obligations</h2>
            <p className="text-gray-700 leading-relaxed">As a Creator, you agree to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Only sell items you personally own</li>
              <li>Only sell items you have personally worn/used (where applicable)</li>
              <li>Provide accurate, honest descriptions</li>
              <li>Ship items within 5 business days of payment</li>
              <li>Package items discreetly and securely</li>
              <li>Provide valid tracking information</li>
              <li>Respond to Buyer inquiries within 48 hours</li>
              <li>Honor all completed sales</li>
              <li>Comply with tax obligations in your jurisdiction</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">11. Buyer Obligations</h2>
            <p className="text-gray-700 leading-relaxed">As a Buyer, you agree to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide accurate shipping information</li>
              <li>Complete all won auctions and purchases</li>
              <li>Not attempt to circumvent the platform for direct transactions</li>
              <li>Treat Creators with respect in all communications</li>
              <li>Not share or redistribute purchased items' photos without consent</li>
              <li>Report any issues within 7 days of delivery</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">12. Prohibited Conduct</h2>
            <p className="text-gray-700 leading-relaxed">Users may not:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Shill bid (bid on your own items)</li>
              <li>Create multiple accounts</li>
              <li>Share account credentials</li>
              <li>Harass, stalk, threaten, or abuse other users</li>
              <li>Request personal contact information or off-platform transactions</li>
              <li>Post personal information about other users</li>
              <li>Attempt to identify or locate Creators without consent</li>
              <li>Use bots or automated systems</li>
              <li>Circumvent security measures or fees</li>
              <li>Engage in fraudulent activity</li>
              <li>Resell purchased items commercially</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">13. Fees</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Buyers: No platform fees (coin purchase prices are final)</li>
              <li>Creators: Platform fee deducted from sales (displayed at listing creation)</li>
              <li>Payment processing fees may apply</li>
              <li>Fee rates are subject to change with notice</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">14. Shipping & Delivery</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Creators must ship within 5 business days</li>
              <li>All packages must be shipped with tracking</li>
              <li>Discreet packaging is required (no explicit markings)</li>
              <li>Fanbids is not responsible for lost, stolen, or damaged shipments</li>
              <li>International shipping may incur customs duties (Buyer's responsibility)</li>
              <li>Creators may use our anonymous shipping label service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">15. Returns & Refunds</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Items as described:</strong> No returns accepted (due to the nature of items)</li>
              <li><strong>Items not as described:</strong> Buyers may request a refund within 7 days of delivery</li>
              <li>Refund requests require photo evidence</li>
              <li>Fanbids will mediate disputes</li>
              <li>Final refund decisions are at Fanbids' discretion</li>
              <li>Fraudulent refund claims will result in account termination</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">16. Privacy & Discretion</h2>
            <p className="text-gray-700 leading-relaxed">
              We take user privacy seriously. See our Privacy Policy for details. Key points:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Creator real names are never disclosed to Buyers</li>
              <li>Buyer information is only shared with Creators for shipping</li>
              <li>All billing appears discreetly on statements</li>
              <li>We never sell user data to third parties</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">17. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              The Fanbids platform, including its design, features, and content, is owned by Fanbids and protected by intellectual property laws.
            </p>
            <p className="text-gray-700 leading-relaxed">
              By posting content, you grant Fanbids a license to use, display, and distribute your content in connection with our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">18. Disclaimer of Warranties</h2>
            <p className="text-gray-700 leading-relaxed">
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. FANBIDS DOES NOT GUARANTEE THE QUALITY, SAFETY, AUTHENTICITY, OR LEGALITY OF ANY ITEMS. ALL TRANSACTIONS ARE BETWEEN BUYERS AND CREATORS.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">19. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, FANBIDS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO FANBIDS IN THE PAST 12 MONTHS.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">20. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless Fanbids from any claims, damages, or expenses arising from your use of the platform, your violation of these Terms, or your violation of any third-party rights.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">21. Dispute Resolution</h2>
            <p className="text-gray-700 leading-relaxed">
              Any disputes arising from these Terms shall be resolved through binding arbitration. You waive your right to a jury trial and class action participation.
            </p>
            <p className="text-gray-700 leading-relaxed">
              For Buyer-Creator disputes, contact Fanbids support for mediation assistance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">22. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may suspend or terminate your account at any time for any reason. Upon termination:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Your access to the platform ceases immediately</li>
              <li>Pending transactions will be completed or refunded</li>
              <li>Creators will receive payouts for completed sales</li>
              <li>You remain liable for obligations incurred prior to termination</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">23. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">24. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may modify these Terms at any time. Material changes will be communicated via email or platform notification. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">25. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Questions about these Terms? Contact us:
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-gray-700">
              <p><strong>Fanbids</strong></p>
              <p>Email: legal@fanbids.com</p>
              <p>Support: support@fanbids.com</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
