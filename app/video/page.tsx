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
        <h1>See the evidence<br />chain <em>run.</em></h1>
        <p className="video-lede">
          A 119-second, captioned walkthrough of why only 17 of 645 records expose a complete evidence chain,
          one chain reviewers can inspect, and the MCP boundary turned into a reproducible interoperability finding.
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
        <article><span>01</span><h2>Measured</h2><p>Only 17 of 645 records expose every project, funding, dataset and software link; all rates retain their denominators.</p></article>
        <article><span>02</span><h2>Inspectable</h2><p>In the 29 July snapshot, the featured chain links funding, projects, institutions, a publication, one dataset and two unique software records.</p></article>
        <article><span>03</span><h2>Time-aware</h2><p>The 8 August bounded probe discloses Graph drift instead of silently rewriting the verified 645-record snapshot.</p></article>
      </section>

      <footer className="video-footer">
        <div className="video-shell"><span>OPEN QUANTUM EVIDENCE ATLAS</span><p>Code: MIT · Data, artifact and story: CC BY 4.0</p><Link href="/">Return to Atlas ↗</Link></div>
      </footer>
    </main>
  );
}
