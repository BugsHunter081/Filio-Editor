import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";

export default function Guide() {
  const { id } = useParams();
  const [g, setG] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .guide(id)
      .then(setG)
      .catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <main className="shell"><div className="err">{err}</div></main>;
  if (!g) return <main className="shell"><p className="muted">Loading…</p></main>;

  return (
    <main className="shell" style={{ paddingBottom: 80, maxWidth: 760 }}>
      <p className="kicker">Guide</p>
      <h1 className="serif">{g.title}</h1>
      <p className="lede">{g.summary}</p>
      <ol className="steps">
        {(g.steps || []).map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {g.tool_slug && (
        <Link className="btn accent" to={`/tools/${g.tool_slug}`}>
          Open {g.title} tool
        </Link>
      )}
      <div style={{ marginTop: 24 }} className="chips">
        {(g.related || []).map((r) => (
          <Link key={r} className="chip" to={`/guides/${r}`}>
            {r}
          </Link>
        ))}
      </div>
    </main>
  );
}
