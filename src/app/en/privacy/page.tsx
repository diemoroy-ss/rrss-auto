import type { Metadata } from "next";
import Image from "next/image";
import Link from 'next/link';
import DotCanvas from '../../../components/DotCanvas';
import LogoMark from '../../../components/LogoMark';

export const metadata: Metadata = {
  title: "Santisoft AI | Privacy Policy",
  description: "Privacy policy and data regulatory compliance for Santisoft AI. Compliant with Law N° 21.719 (modernization of Law N° 19.628 in Chile).",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/favicon.svg",
  },
};

export default function Privacy() {
  return (
    <div className="landing-page-root relative overflow-x-hidden min-h-screen pb-20">
      <DotCanvas />
      
      {/* 1. PromoBanner */}
      <div className="promo">
        <span className="on-air"></span>
        REGULATORY COMPLIANCE · CHILEAN PERSONAL DATA PROTECTION LAW (LAW N° 21.719)
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
            <span className="eyebrow">Transparency and Security</span>
            <h2>Privacy <em>Policy.</em></h2>
            <p className="sub" style={{ margin: '12px 0 0 0' }}>
              At Santisoft AI we take your privacy very seriously. This policy details the treatment of your data in accordance with applicable legislation and in proactive alignment with the standards of <strong>Law N° 21.719</strong> (which modernizes Law N° 19.628 of Chile).
            </p>
          </div>

          <div className="panel" style={{ padding: '40px 30px', background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: '16px' }}>
            <div className="fmono" style={{ fontSize: '12px', color: 'var(--ink-faint)', marginBottom: '30px', display: 'flex', gap: '15px' }}>
              <span>LAST UPDATED: AUGUST 2026</span>
              <span>VERSION: 2.2 (ALIGNED WITH LAW N° 21.719)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '35px' }}>
              
              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  1. Santisoft's Role: Data Controller and Data Processor
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  According to the new data protection regulations in Chile:
                  <br />
                  • <strong>Data Controller:</strong> Santisoft AI acts as the Data Controller regarding the personal data we collect directly from you to create your client account, manage billing, and configure your preferences.
                  <br />
                  • <strong>Data Processor:</strong> We act as Data Processors regarding the information and databases you connect or the content of your audience that flows through our social media, blog, or WhatsApp integrations. You remain the Data Controller and exclusive owner of that data.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  2. Legal Basis for Processing
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  We process your data based solely on the following conditions of lawfulness established by law:
                  <br />
                  • <strong>Your explicit consent</strong> when connecting your official accounts.
                  <br />
                  • <strong>Performance of a contract:</strong> We need to process the information of your official social networks to schedule, draft via AI, and execute the publications on autopilot that you have contracted.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  3. Data Collected and Use of Third-Party APIs
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6', marginBottom: '12px' }}>
                  We collect only the minimum and necessary information for the operation of our automation tools:
                </p>
                <ul style={{ listStyleType: 'circle', paddingLeft: '20px', fontSize: '14.5px', color: 'var(--ink-dim)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li><strong>Encrypted Access Tokens:</strong> Encrypted temporary credentials (AES-256) to publish on Meta (Facebook/Instagram), TikTok, Google Business Profile, YouTube Shorts, and X (Twitter). We never store your passwords in plain text.</li>
                  <li>
                    <strong>Use of YouTube API Services:</strong> Our application uses the official YouTube API services. By connecting your YouTube channel in Santisoft, you agree to be bound by the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)', textDecoration: 'underline' }}>YouTube Terms of Service</a> and the <a href="http://www.google.com/policies/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)', textDecoration: 'underline' }}>Google Privacy Policy</a>. You can revoke Santisoft's access at any time from the <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)', textDecoration: 'underline' }}>Google Security Settings Page</a>.
                  </li>
                  <li>
                    <strong>Limited Use Compliance (Google API):</strong> Santisoft AI's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--signal)', textDecoration: 'underline' }}>Google API Services User Data Policy</a>, including the Limited Use requirements.
                  </li>
                  <li>
                    <strong>Use of X (Twitter) API Services:</strong> Santisoft interacts with the X v2 API via OAuth 2.0 PKCE to schedule and publish tweets, threads, and audiovisual content on your authorized account. We do not collect third-party personal data or private messages from X.
                  </li>
                  <li><strong>Performance Metrics:</strong> Statistical data about your publications and Meta Ads campaigns to graph your reports in the dashboard.</li>
                  <li><strong>Artificial Intelligence (AI) Data:</strong> The processing of scripts, copies, and images is done through the private Google Gemini API. Your data is NOT used to train external public models.</li>
                </ul>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  4. International Transfer and Security
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  Our databases reside on secure Google Cloud servers in the United States and Europe. We implement bank-grade SSL/TLS encryption for all communications and databases. In accordance with the modernization of Law N° 19.628, contracted providers comply with international security standards equivalent to the requirements of the European Union (GDPR).
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  5. Rights of Data Subjects (ARCO-P)
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6', marginBottom: '12px' }}>
                  Law N° 21.719 guarantees you the full exercise of your fundamental data protection rights:
                </p>
                <ul style={{ listStyleType: 'square', paddingLeft: '20px', fontSize: '14.5px', color: 'var(--ink-dim)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li><strong>Access:</strong> Know what data of yours we have stored.</li>
                  <li><strong>Rectification:</strong> Correct inaccurate or outdated information.</li>
                  <li><strong>Cancellation (Deletion):</strong> Request the permanent deletion of your data from our systems.</li>
                  <li><strong>Opposition:</strong> Object to the processing of your data for certain specific purposes.</li>
                  <li><strong>Portability:</strong> Request a structured copy of your data to transfer it to another entity.</li>
                </ul>
                <p style={{ fontSize: '14.5px', color: 'var(--ink-dim)', marginTop: '12px' }}>
                  You can exercise any of these rights directly in your profile settings or by sending a formal request to <strong style={{ color: 'var(--signal)' }}>legal@santisoft.cl</strong>. We will respond to your request within the established legal timeframe.
                </p>
              </section>

              <section style={{ borderTop: '1px solid var(--line)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--disp)', marginBottom: '12px', fontWeight: 600 }}>
                  6. Security Breach Notification
                </h3>
                <p style={{ fontSize: '15px', color: 'var(--ink-dim)', lineHeight: '1.6' }}>
                  In the event of any security incident or breach that affects the confidentiality of your data, Santisoft AI will immediately notify affected users and the **Personal Data Protection Agency** of Chile within a period not exceeding 72 hours from the detection of the event, detailing the mitigation measures adopted.
                </p>
              </section>

            </div>

            <footer style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid var(--line)' }}>
              <div style={{ background: 'var(--panel-2)', padding: '24px', borderRadius: '12px', border: '1px dashed var(--line-strong)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '16px', color: 'var(--ink)' }}>Do you want to revoke your consents immediately?</p>
                  <p style={{ fontSize: '13px', color: 'var(--ink-dim)', marginTop: '4px' }}>You can request total disconnection and permanent deletion of your account.</p>
                </div>
                <Link href="/eliminaciondatos" className="btn btn-primary btn-sm">Delete Data</Link>
              </div>
            </footer>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: '60px' }}>
        <div className="wrap">
          <div className="fmono">
            <span className="on-air"></span>
            © 2026 SANTISOFT AI · ALIGNED WITH DATA LAW N° 21.719
          </div>
          <div className="flinks">
            <Link href="/en/terms">Terms of Service</Link>
            <Link href="/en/privacy">Privacy Policy</Link>
            <span style={{ margin: '0 8px', color: 'var(--line-strong)' }}>|</span>
            <Link href="/privacidad">🇪🇸 Español</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
