import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api, downloadUrl } from "../api";
import { useAuth } from "../auth.jsx";

export default function Account() {
  const { user, ready } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.jobs().then(setJobs).catch(() => {});
    api.usage().then(setUsage).catch(() => {});
  }, [user]);

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <main className="shell" style={{ paddingBottom: 60 }}>
      <h1 className="serif">Account</h1>
      <div className="layout">
        <aside className="panel">
          <p>
            <strong>{user.name}</strong>
            <br />
            <span className="muted">{user.email}</span>
          </p>
          <p>
            Plan <span className="pill">{user.plan}</span>
            {user.role && user.role !== "user" && (
              <>
                {" "}
                <span className="pill warn">{user.role.replace("_", " ")}</span>
              </>
            )}
          </p>
          {usage && (
            <p className="muted">
              {usage.jobs_today} / {usage.quota} jobs today
              <br />
              {Math.round((usage.storage_bytes || 0) / 1024)} KB stored
            </p>
          )}
        </aside>
        <section className="card">
          <h2>Recent jobs</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Tool</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    <Link to={`/tools/${j.tool}`}>{j.tool}</Link>
                  </td>
                  <td>
                    <span className={`pill ${j.status === "failed" ? "warn" : ""}`}>{j.status}</span>
                  </td>
                  <td>
                    {j.output_file_id && (
                      <a href={downloadUrl(j.output_file_id)}>Download</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!jobs.length && <p className="muted">No jobs yet.</p>}
        </section>
      </div>
    </main>
  );
}
