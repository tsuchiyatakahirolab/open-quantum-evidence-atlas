"use client";

import Link from "next/link";
import "./video.css";

const videoUrl = "/media/open-quantum-evidence-atlas-120s.mp4";

export default function VideoPage() {
  return (
    <main className="video-page">
      <header className="video-nav video-shell">
        <Link href="/" className="video-brand"><span aria-hidden="true">◉</span><span>OPEN QUANTUM<br />EVIDENCE ATLAS</span></Link>
        <span><i /> PUBLIC WALKTHROUGH · 01:59</span>
        <Link href="/audit">Run auditor ↗</Link>
      </header>

      <section className="video-hero video-shell">
        <p className="video-kicker">OPENAIRE AI HACKATHON · THEME C</p>
        <h1>Watch a policy question<br />become an <em>action.</em></h1>
        <p className="video-lede">
          In 119 seconds: find where a funded portfolio loses reusable-output links, verify one exact chain,
          export what to fix, and see why the Alien/OpenAIRE MCP check makes the result safer.
        </p>
      </section>

      <section className="video-player-section">
        <div className="video-shell">
          <div className="video-frame">
            <video controls playsInline preload="metadata" poster="/og-atlas.png">
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support HTML video. <a href={videoUrl}>Open the MP4 directly.</a>
            </video>
          </div>
          <div className="video-meta">
            <div><span>DURATION</span><b>01:59</b></div>
            <div><span>FORMAT</span><b>1080p · H.264</b></div>
            <div><span>ACCESS</span><b>Burned-in captions</b></div>
            <div className="video-links"><a href={videoUrl}>Open MP4 ↗</a><a href="/media/open-quantum-evidence-atlas-transcript.txt" download>Transcript ↓</a></div>
          </div>
        </div>
      </section>

      <section className="video-notes video-shell">
        <article><span>01</span><h2>Find</h2><p>Only 17 of 645 records expose every project, funding, dataset and software link; every rate keeps its denominator.</p></article>
        <article><span>02</span><h2>Verify</h2><p>Open one exact funding-to-software chain and inspect the underlying OpenAIRE, DOI, Figshare and software records.</p></article>
        <article><span>03</span><h2>Act</h2><p>Export the missing-identifier action, then repeat the same bounded audit to measure Graph-entry improvement over time.</p></article>
      </section>

      <footer className="video-footer">
        <div className="video-shell"><span>OPEN QUANTUM EVIDENCE ATLAS</span><p>Code: MIT · Data, artifact and story: CC BY 4.0</p><Link href="/">Return to Atlas ↗</Link></div>
      </footer>
    </main>
  );
}
