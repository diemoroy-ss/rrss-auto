import type { Metadata } from "next";
import Image from "next/image";
import Link from 'next/link';
import DotCanvas from '../../../components/DotCanvas';
import LogoMark from '../../../components/LogoMark';

export const metadata: Metadata = {
  title: "Santisoft AI | Terms of Service",
  description: "Terms of service and legal conditions of use for the Santisoft AI platform.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
};

export default function Terms() {
  return (
    <div className="landing-page-root relative overflow-x-hidden min-h-screen pb-20">
      <DotCanvas />
      
      {/* 1. PromoBanner */}
      <div className="promo">
        <span className="on-air"></span>
        GENERAL CONDITIONS · CONTRACTING AND PLATFORM USE
      </div>

      {/* 2. Nav */}
      <nav>
        <div className="wrap">
          <Link href="/" className="logo">
            <LogoMark size={24} />
            SANTISOFT AI
          </Link>
          <div className="nav-links">
            <Link href="/" className="btn btn-ghost btn-sm">← Back to Home</Link>
          </div>
        </div>
      </nav>

      {/* 3. Main Content Section */}
      <section style={{ borderTop: 'none', paddingTop: '60px' }}>
        <div className="wrap">
          <div className="section-head" style={{ maxWidth: '800px', marginBottom: '40px' }}>
            <span className="eyebrow">Regulatory Framework</span>
            <h2>Terms of <em>Service.</em></h2>
            <p className="sub" style={{ margin: '12px 0 0 0' }}>
              By registering and using the Santisoft AI automation tools, you agree to be bound by the following set of service conditions, responsibilities, and financial charges.
            </p>
          </div>

          <div className="panel" style={{ padding: '40px 30px', background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: '16px' }}>
            <div className="fmono" style={{ fontSize: '12px', color: 'var(--ink-faint)', marginBottom: '30px', display: 'flex', gap: '15px' }}>
              <span>LAST UPDATED: AUGUST 2026</span>
              <span>VERSION: 2.0 (UPDATED)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
              
              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  1. Acceptance of Terms and Social Media Integration
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6', marginBottom: '10px' }}>
                  By creating an account in <strong>Santisoft AI</strong> (the Application), you authorize the management and automatic publication on your connected social networks (Meta Facebook/Instagram, TikTok, Google Business Profile, YouTube Shorts, and X/Twitter) and official blogs. Publications are executed under your explicit control through the technical automation infrastructure that connects the official APIs of each platform.
                </p>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  • <strong>YouTube Terms:</strong> By using the publishing features on YouTube Shorts, the user expressly agrees to be bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)', textDecoration: 'underline' }}>YouTube Terms of Service</a> and Google's community guidelines.
                  <br />
                  • <strong>X (Twitter) Terms:</strong> Publications on X are governed by the X Developer Agreements and Policies. The user agrees not to use the platform for the emission of spam or deceptive automated content.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  2. Data Protection and Law N° 21.719 of Chile
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  The processing of personal data in Santisoft AI is strictly governed by the principles of lawfulness, proportionality, purpose, and security established in <strong>Law N° 21.719 of Chile</strong>. Users retain absolute control over their data and can request access, rectification, deletion, or portability of their information at any time.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  3. Content Responsibility and Advertising
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6', marginBottom: '10px' }}>
                  • <strong>Organic Posts:</strong> The client is the sole creator and responsible party for the material (images, texts, scripts, videos) generated and instructed to be published on their profiles. Santisoft AI does not monitor the accuracy, copyright, or legality of the published content.
                </p>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  • <strong>Paid Advertising (Meta Ads):</strong> By using the integrated Meta Ads campaign creator, you authorize the consumption of your budget directly from your Meta ad account. <strong>The user assumes 100% financial and billing responsibility</strong>. Santisoft AI does not process advertising charges nor is it responsible for the performance, ad rejections, or blocks derived from Meta's advertising policies.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  4. Subscription Plans and Refunds
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  We offer monthly and annual plans billed automatically in advance to your credit card or authorized payment method. You can cancel your subscription at any time from the control panel. Upon cancellation, you will retain access until the end of your current billing cycle. Amounts already charged are non-refundable except in cases of prolonged and irreparable technical failures directly attributable to our platform.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  5. Exclusive Use and AI Limits
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  The Artificial Intelligence service powering Santisoft AI generates suggestions based on advanced language models. Although we optimize responses to maximize conversions and SEO, the client must validate that the content complies with their business regulations before publishing it on autopilot. We do not guarantee specific traffic, clicks, or commercial sales results derived directly or indirectly from the generated content.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  6. Availability and Service Suspensions
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  Santisoft AI relies on external providers (such as Google Cloud, APIs from Meta, TikTok, LinkedIn, and Google Gemini). We are not responsible for interruptions caused by global outages of these APIs or unforeseen maintenance. We reserve the right to immediately suspend accounts of users who use our platform for mass spam, hate speech, or illegal activities that violate the community policies of the social networks.
                </p>
              </section>

            </div>

            <footer style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid var(--line)', textAlign: 'center' }}>
              <p style={{ fontSize: '13.5px', color: 'var(--ink-dim)' }}>
                Do you have questions or need assistance regarding the contracts? Write to us directly at <strong style={{ color: 'var(--signal)' }}>legal@santisoft.cl</strong>
              </p>
            </footer>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '60px' }}>
        <div className="wrap">
          <div className="fmono">
            <span className="on-air"></span>
            © 2026 SANTISOFT AI · LEGAL TERMS OF OPERATION
          </div>
          <div className="flinks">
            <Link href="/en/terms">Terms of Service</Link>
            <Link href="/en/privacy">Privacy Policy</Link>
            <span style={{ margin: '0 8px', color: 'var(--line-strong)' }}>|</span>
            <Link href="/terminos">🇪🇸 Español</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
