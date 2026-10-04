import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, downloadUrl, previewPageUrl } from "../api";
import { findTool } from "../tools";

const emptyOptions = (slug) => {
  const map = {
    compress: { level: "medium" },
    split: { ranges: "1-1" },
    extract: { ranges: "1" },
    "delete-pages": { ranges: "1" },
    crop: { margin: 36, ranges: "" },
    rotate: { angle: 90, ranges: "" },
    resize: { page_size: "a4", ranges: "" },
    organize: { order: [] },
    ocr: { language: "eng", ranges: "" },
    deskew: { ranges: "" },
    protect: { password: "", allow_print: true, allow_copy: false, allow_edit: false },
    unlock: { password: "" },
    watermark: { text: "CONFIDENTIAL", opacity: 0.18, rotation: 45, size: 48, ranges: "" },
    flatten: {},
    metadata: { title: "", author: "", subject: "", keywords: "", creator: "", producer: "" },
    bookmarks: { bookmarks: [{ title: "Chapter 1", page: 1, level: 1 }] },
    "header-footer": { header: "", footer: "", page_numbers: true, ranges: "" },
    "page-numbers": { header: "", footer: "", page_numbers: true },
    "batch-numbering": { header: "", footer: "", page_numbers: true },
    "remove-annotations": { ranges: "" },
    grayscale: {},
    flip: { axis: "horizontal" },
    "n-up": { n: 2 },
    "split-size": { max_mb: 2 },
    "split-text": { text: "" },
    "pdf-to-jpg": { quality: 150, ranges: "" },
    "pdf-to-word": { ranges: "" },
    "pdf-to-excel": { ranges: "" },
    "pdf-to-ppt": { ranges: "" },
    "pdf-to-text": { ranges: "" },
    "jpg-to-pdf": { page_size: "a4" },
    "html-to-pdf": { html: "<h1>Hello from Folio</h1><p>Paste HTML here.</p>" },
    "word-to-pdf": {},
    merge: { cover_title: "" },
    "fill-sign": { fields: [] },
    editor: { actions: [] },
    "create-forms": { actions: [] },
    rename: {},
    repair: {},
  };
  return { ...(map[slug] || {}) };
};

export default function Tool() {
  const { slug } = useParams();
  const tool = findTool(slug);
  const inputRef = useRef();
  const [files, setFiles] = useState([]);
  const [uploaded, setUploaded] = useState([]);
  const [options, setOptions] = useState(emptyOptions(slug));
  const [job, setJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState(null);
  const [over, setOver] = useState(false);
  const [editDraft, setEditDraft] = useState({ type: "text", page: 1, x: 72, y: 120, value: "Hello", w: 140, h: 18, size: 14 });

  useEffect(() => {
    setFiles([]);
    setUploaded([]);
    setOptions(emptyOptions(slug));
    setJob(null);
    setErr("");
    setPreview(null);
  }, [slug]);

  useEffect(() => {
    if (!job || job.status === "done" || job.status === "failed") return;
    const t = setInterval(async () => {
      try {
        const next = await api.job(job.id);
        setJob(next);
      } catch {
        /* ignore poll errors */
      }
    }, 900);
    return () => clearInterval(t);
  }, [job]);

  const onDrop = (list) => {
    const arr = [...list];
    setFiles(tool?.multi ? [...files, ...arr] : arr.slice(0, 1));
  };

  const setOpt = (key, value) => setOptions((o) => ({ ...o, [key]: value }));

  const run = async () => {
    setErr("");
    setBusy(true);
    setJob(null);
    try {
      let ids = uploaded.map((f) => f.id);
      if (files.length) {
        const recs = await api.upload(files);
        setUploaded(recs);
        ids = recs.map((f) => f.id);
        if (recs[0] && recs[0].mime === "application/pdf") {
          const p = await api.preview(recs[0].id);
          setPreview(p);
        }
      }
      if (!ids.length && slug !== "html-to-pdf") throw new Error("Add a file first");
      const created = await api.createJob({ tool: slug, file_ids: ids, options });
      setJob(created);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const addField = (type) => {
    const field = { ...editDraft, type };
    if (slug === "fill-sign") setOpt("fields", [...(options.fields || []), field]);
    else setOpt("actions", [...(options.actions || []), field]);
  };

  if (!tool) {
    return (
      <main className="shell">
        <p>Unknown tool.</p>
        <Link to="/">Back home</Link>
      </main>
    );
  }

  return (
    <main className="shell layout">
      <aside className="panel">
        <div className="kicker">{tool.category}</div>
        <h2 className="serif" style={{ margin: "8px 0 6px" }}>
          {tool.name}
        </h2>
        <p className="muted">{tool.blurb}</p>

        {slug !== "html-to-pdf" && (
          <div
            className={`drop ${over ? "over" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              onDrop(e.dataTransfer.files);
            }}
          >
            <strong>Drop files here</strong>
            <p className="muted">or click to browse · {tool.accept}</p>
            <input
              ref={inputRef}
              type="file"
              hidden
              multiple={tool.multi}
              accept={tool.accept}
              onChange={(e) => onDrop(e.target.files)}
            />
          </div>
        )}

        {files.map((f, i) => (
          <div className="file-row" key={i}>
            <span>{f.name}</span>
            <span className="muted">{Math.round(f.size / 1024)} KB</span>
          </div>
        ))}

        <Options slug={slug} options={options} setOpt={setOpt} />

        {(slug === "editor" || slug === "fill-sign" || slug === "create-forms") && (
          <div>
            <label className="field">Place on page</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input type="number" value={editDraft.page} onChange={(e) => setEditDraft({ ...editDraft, page: +e.target.value })} />
              <input type="text" value={editDraft.value} onChange={(e) => setEditDraft({ ...editDraft, value: e.target.value })} />
              <input type="number" value={editDraft.x} onChange={(e) => setEditDraft({ ...editDraft, x: +e.target.value })} />
              <input type="number" value={editDraft.y} onChange={(e) => setEditDraft({ ...editDraft, y: +e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {(slug === "fill-sign"
                ? ["text", "check", "date", "signature"]
                : ["text", "highlight", "strikethrough", "whiteout", "rect", "link"]
              ).map((t) => (
                <button key={t} className="btn outline" type="button" onClick={() => addField(t)}>
                  {t}
                </button>
              ))}
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              {(options.fields || options.actions || []).length} placements queued
            </p>
          </div>
        )}

        <button className="btn accent" style={{ width: "100%", marginTop: 16 }} disabled={busy} onClick={run}>
          {busy ? "Working…" : "Apply & process"}
        </button>
        {err && <div className="err">{err}</div>}
      </aside>

      <section className="card">
        <div className="section-head" style={{ marginTop: 0 }}>
          <h2>Workspace</h2>
          {preview && <span className="muted">{preview.page_count} pages</span>}
        </div>
        {preview?.pages?.length ? (
          <div className="thumbs">
            {preview.pages.map((name) => (
              <img key={name} src={previewPageUrl(preview.file.id, name)} alt={name} />
            ))}
          </div>
        ) : (
          <p className="muted">Upload a PDF to see page previews. Processing runs in the background.</p>
        )}

        {job && (
          <div className="status">
            <div style={{ flex: 1 }}>
              <strong>{job.status === "done" ? "Ready" : job.status}</strong>
              <div className="muted">{job.message || job.error}</div>
              <div className="bar">
                <span style={{ width: `${job.progress || 0}%` }} />
              </div>
            </div>
            {job.status === "done" && job.output_file_id && (
              <a className="btn" href={downloadUrl(job.output_file_id)}>
                Download
              </a>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function Options({ slug, options, setOpt }) {
  if (slug === "compress") {
    return (
      <>
        <label className="field">Compression level</label>
        <select value={options.level} onChange={(e) => setOpt("level", e.target.value)}>
          <option value="low">Low — better quality</option>
          <option value="medium">Medium</option>
          <option value="high">High — smallest file</option>
        </select>
      </>
    );
  }
  if (["split", "extract", "delete-pages", "crop", "rotate", "ocr", "deskew", "watermark", "header-footer", "remove-annotations", "pdf-to-jpg", "pdf-to-word", "pdf-to-excel", "pdf-to-ppt", "pdf-to-text"].includes(slug)) {
    return (
      <>
        {slug === "split" && (
          <>
            <label className="field">Ranges (use ; between files)</label>
            <input value={options.ranges} onChange={(e) => setOpt("ranges", e.target.value)} placeholder="1-3;4-8" />
          </>
        )}
        {slug !== "split" && slug !== "watermark" && slug !== "header-footer" && slug !== "ocr" && slug !== "crop" && slug !== "rotate" && (
          <>
            <label className="field">Page range</label>
            <input value={options.ranges || ""} onChange={(e) => setOpt("ranges", e.target.value)} placeholder="1-3,5" />
          </>
        )}
        {["extract", "delete-pages", "crop", "rotate", "ocr", "deskew", "watermark", "header-footer", "remove-annotations"].includes(slug) && slug !== "split" && (
          <>
            {slug !== "extract" && slug !== "delete-pages" ? null : (
              <>
                <label className="field">Pages</label>
                <input value={options.ranges || ""} onChange={(e) => setOpt("ranges", e.target.value)} placeholder="2,5-7" />
              </>
            )}
          </>
        )}
        {slug === "crop" && (
          <>
            <label className="field">Margin (pt)</label>
            <input type="number" value={options.margin} onChange={(e) => setOpt("margin", +e.target.value)} />
            <label className="field">Pages</label>
            <input value={options.ranges || ""} onChange={(e) => setOpt("ranges", e.target.value)} />
          </>
        )}
        {slug === "rotate" && (
          <>
            <label className="field">Angle</label>
            <select value={options.angle} onChange={(e) => setOpt("angle", +e.target.value)}>
              <option value={90}>90</option>
              <option value={180}>180</option>
              <option value={270}>270</option>
            </select>
            <label className="field">Pages</label>
            <input value={options.ranges || ""} onChange={(e) => setOpt("ranges", e.target.value)} />
          </>
        )}
        {slug === "ocr" && (
          <>
            <label className="field">Language</label>
            <input value={options.language} onChange={(e) => setOpt("language", e.target.value)} />
            <label className="field">Pages</label>
            <input value={options.ranges || ""} onChange={(e) => setOpt("ranges", e.target.value)} />
          </>
        )}
        {slug === "watermark" && (
          <>
            <label className="field">Watermark text</label>
            <input value={options.text} onChange={(e) => setOpt("text", e.target.value)} />
            <label className="field">Opacity</label>
            <input type="number" step="0.05" value={options.opacity} onChange={(e) => setOpt("opacity", +e.target.value)} />
            <label className="field">Pages</label>
            <input value={options.ranges || ""} onChange={(e) => setOpt("ranges", e.target.value)} />
          </>
        )}
        {slug === "header-footer" && (
          <>
            <label className="field">Header</label>
            <input value={options.header} onChange={(e) => setOpt("header", e.target.value)} />
            <label className="field">Footer</label>
            <input value={options.footer} onChange={(e) => setOpt("footer", e.target.value)} />
          </>
        )}
        {slug === "pdf-to-jpg" && (
          <>
            <label className="field">DPI quality</label>
            <input type="number" value={options.quality} onChange={(e) => setOpt("quality", +e.target.value)} />
          </>
        )}
      </>
    );
  }
  if (slug === "protect") {
    return (
      <>
        <label className="field">Password</label>
        <input type="password" value={options.password} onChange={(e) => setOpt("password", e.target.value)} />
        <label className="field">
          <input type="checkbox" checked={!!options.allow_print} onChange={(e) => setOpt("allow_print", e.target.checked)} /> Print
        </label>
        <label className="field">
          <input type="checkbox" checked={!!options.allow_copy} onChange={(e) => setOpt("allow_copy", e.target.checked)} /> Copy
        </label>
      </>
    );
  }
  if (slug === "unlock") {
    return (
      <>
        <label className="field">Password</label>
        <input type="password" value={options.password} onChange={(e) => setOpt("password", e.target.value)} />
      </>
    );
  }
  if (slug === "metadata") {
    return ["title", "author", "subject", "keywords"].map((k) => (
      <div key={k}>
        <label className="field">{k}</label>
        <input value={options[k] || ""} onChange={(e) => setOpt(k, e.target.value)} />
      </div>
    ));
  }
  if (slug === "bookmarks") {
    const items = options.bookmarks || [];
    return (
      <>
        {items.map((b, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px", gap: 8 }}>
            <input
              value={b.title}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...b, title: e.target.value };
                setOpt("bookmarks", next);
              }}
            />
            <input
              type="number"
              value={b.page}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...b, page: +e.target.value };
                setOpt("bookmarks", next);
              }}
            />
          </div>
        ))}
        <button
          className="btn outline"
          type="button"
          style={{ marginTop: 8 }}
          onClick={() => setOpt("bookmarks", [...items, { title: "Section", page: 1, level: 1 }])}
        >
          Add bookmark
        </button>
      </>
    );
  }
  if (slug === "resize" || slug === "jpg-to-pdf") {
    return (
      <>
        <label className="field">Page size</label>
        <select value={options.page_size} onChange={(e) => setOpt("page_size", e.target.value)}>
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
          <option value="legal">Legal</option>
        </select>
      </>
    );
  }
  if (slug === "flip") {
    return (
      <>
        <label className="field">Axis</label>
        <select value={options.axis} onChange={(e) => setOpt("axis", e.target.value)}>
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </>
    );
  }
  if (slug === "n-up") {
    return (
      <>
        <label className="field">Pages per sheet</label>
        <select value={options.n} onChange={(e) => setOpt("n", +e.target.value)}>
          <option value={2}>2</option>
          <option value={4}>4</option>
        </select>
      </>
    );
  }
  if (slug === "split-size") {
    return (
      <>
        <label className="field">Max size (MB)</label>
        <input type="number" value={options.max_mb} onChange={(e) => setOpt("max_mb", +e.target.value)} />
      </>
    );
  }
  if (slug === "split-text") {
    return (
      <>
        <label className="field">Split when text appears</label>
        <input value={options.text} onChange={(e) => setOpt("text", e.target.value)} />
      </>
    );
  }
  if (slug === "organize") {
    return (
      <>
        <label className="field">Page order (0-based, comma separated)</label>
        <input
          value={(options.order || []).join(",")}
          onChange={(e) =>
            setOpt(
              "order",
              e.target.value
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
                .map((x) => Number(x))
            )
          }
          placeholder="0,2,1"
        />
      </>
    );
  }
  if (slug === "merge") {
    return (
      <>
        <label className="field">Cover title (optional)</label>
        <input value={options.cover_title} onChange={(e) => setOpt("cover_title", e.target.value)} />
      </>
    );
  }
  if (slug === "html-to-pdf") {
    return (
      <>
        <label className="field">HTML</label>
        <textarea value={options.html} onChange={(e) => setOpt("html", e.target.value)} />
      </>
    );
  }
  return null;
}
