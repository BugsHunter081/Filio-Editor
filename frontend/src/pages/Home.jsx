import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES, TOOLS, toolsFor } from "../tools";

export default function Home() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return null;
    return TOOLS.filter(
      (t) => t.name.toLowerCase().includes(s) || t.blurb.toLowerCase().includes(s) || t.slug.includes(s)
    );
  }, [q]);

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <div className="kicker">PDF studio for everyday work</div>
          <h1>Edit, convert, and tidy PDFs without the clutter.</h1>
          <p className="lede">
            Folio is a calm desk for documents — merge, split, sign, compress, OCR, and convert in a few quiet steps.
          </p>
          <div className="hero-actions">
            <Link className="btn accent" to="/tools/editor">
              Open PDF Editor
            </Link>
            <Link className="btn outline" to="/guides">
              How-to guides
            </Link>
          </div>
        </div>
        <div className="stack-card">
          <div className="page-preview">
            <div style={{ marginTop: 28 }}>
              <div className="rule" />
              <div className="rule short" />
              <div className="rule" />
              <div className="rule short" />
              <div className="chips">
                <span className="chip">Merge</span>
                <span className="chip">OCR</span>
                <span className="chip">Fill & Sign</span>
                <span className="chip">Compress</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <form className="search" onSubmit={(e) => e.preventDefault()} id="tools">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tools — compress, watermark, excel…"
        />
        <button className="btn" type="button">
          Search
        </button>
      </form>

      {filtered ? (
        <>
          <div className="section-head">
            <h2>Results</h2>
            <span className="muted">{filtered.length} tools</span>
          </div>
          <div className="grid">
            {filtered.map((t) => (
              <ToolCard key={t.category + t.slug + t.name} tool={t} />
            ))}
          </div>
        </>
      ) : (
        CATEGORIES.map((c) => (
          <section key={c.id}>
            <div className="section-head">
              <h2>{c.label}</h2>
              <span className="muted">{toolsFor(c.id).length} tools</span>
            </div>
            <div className="grid">
              {toolsFor(c.id).map((t) => (
                <ToolCard key={c.id + t.slug + t.name} tool={t} />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}

function ToolCard({ tool }) {
  return (
    <Link className="tool-card" to={`/tools/${tool.slug}`}>
      <div className="glyph">{tool.mark}</div>
      <h3>{tool.name}</h3>
      <p>{tool.blurb}</p>
    </Link>
  );
}
