import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function Guides() {
  const [guides, setGuides] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .guides()
      .then(setGuides)
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <main className="shell" style={{ paddingBottom: 60 }}>
      <div className="section-head">
        <h1 className="serif">How-to guides</h1>
      </div>
      <p className="lede">Short walkthroughs for the workflows people use most.</p>
      {err && <div className="err">{err}</div>}
      <div className="guide-list">
        {guides.map((g) => (
          <Link key={g.id} className="tool-card" to={`/guides/${g.id}`}>
            <div className="glyph">?</div>
            <h3>{g.title}</h3>
            <p>{g.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
