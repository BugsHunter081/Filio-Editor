import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth.jsx";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  plan: "free",
  role: "user",
  daily_quota: 40,
  is_active: true,
  notes: "",
  subscription_status: "active",
};

function roleLabel(role) {
  return (role || "user").replace("_", " ");
}

function quotaLabel(n) {
  if (n === 0 || n === "0") return "Unlimited";
  return `${n}/day`;
}

export default function Admin() {
  const { user, ready } = useAuth();
  const isSuper = user?.role === "super_admin";
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setErr("");
    try {
      const overview = await api.admin();
      setData(overview);
      if (isSuper) {
        const list = await api.adminUsers({ q, plan: planFilter, role: roleFilter });
        setUsers(list);
      } else {
        setUsers(overview.users_list || []);
      }
    } catch (e) {
      setErr(e.message);
    }
  };

  useEffect(() => {
    if (!user?.is_admin && user?.role !== "super_admin") return;
    load();
  }, [user, q, planFilter, roleFilter]);

  const selected = useMemo(() => users.find((u) => u.id === editing) || null, [users, editing]);

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm(emptyForm);
    setOk("");
    setErr("");
  };

  const openEdit = (u) => {
    setCreating(false);
    setEditing(u.id);
    setForm({
      name: u.name || "",
      email: u.email || "",
      password: "",
      plan: u.plan || "free",
      role: u.role || "user",
      daily_quota: u.daily_quota ?? 40,
      is_active: u.is_active !== false,
      notes: u.subscription?.notes || "",
      subscription_status: u.subscription?.status || "active",
    });
    setOk("");
    setErr("");
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    setOk("");
    try {
      if (creating) {
        await api.adminCreateUser({
          name: form.name,
          email: form.email,
          password: form.password,
          plan: form.plan,
          role: form.role,
          daily_quota: Number(form.daily_quota),
          is_active: form.is_active,
          notes: form.notes,
        });
        setOk("User created.");
        setCreating(false);
        setForm(emptyForm);
      } else if (editing) {
        const body = {
          name: form.name,
          email: form.email,
          plan: form.plan,
          role: form.role,
          daily_quota: Number(form.daily_quota),
          is_active: form.is_active,
          notes: form.notes,
          subscription_status: form.subscription_status,
        };
        if (form.password) body.password = form.password;
        await api.adminUpdateUser(editing, body);
        setOk("User updated.");
      }
      await load();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    if (!editing || !form.password) {
      setErr("Enter a new password first.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await api.adminResetPassword(editing, form.password);
      setOk("Password reset.");
      setForm((f) => ({ ...f, password: "" }));
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (u) => {
    setBusy(true);
    setErr("");
    try {
      await api.adminUpdateUser(u.id, { is_active: !u.is_active });
      await load();
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin && user.role !== "super_admin") {
    return (
      <main className="shell">
        <p>Admin only.</p>
      </main>
    );
  }

  return (
    <main className="shell" style={{ paddingBottom: 60 }}>
      <div className="section-head">
        <h1 className="serif">{isSuper ? "Super admin" : "Admin"}</h1>
        {isSuper && (
          <button className="btn accent" type="button" onClick={openCreate}>
            New user
          </button>
        )}
      </div>
      <p className="muted">
        {isSuper
          ? "Manage every account, credential, role, and subscription from one desk."
          : "Overview only. Sign in as super admin to change credentials and plans."}
      </p>
      {err && <div className="err">{err}</div>}
      {ok && <div className="ok">{ok}</div>}

      {data && (
        <div className="grid" style={{ margin: "18px 0 22px" }}>
          {[
            ["Users", data.users],
            ["Jobs", data.jobs],
            ["Active plans", data.active_subs ?? "—"],
            ["Failed", data.failed_jobs],
          ].map(([k, v]) => (
            <div className="card" key={k}>
              <div className="muted">{k}</div>
              <h2 style={{ margin: 0 }}>{v}</h2>
            </div>
          ))}
        </div>
      )}

      {isSuper && (
        <div className="search" style={{ marginBottom: 18 }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" />
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} style={{ width: 140 }}>
            <option value="">All plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="business">Business</option>
            <option value="unlimited">Unlimited</option>
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: 160 }}>
            <option value="">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super admin</option>
          </select>
        </div>
      )}

      <div className="layout">
        <section className="card" style={{ gridColumn: isSuper && (creating || selected) ? "auto" : "1 / -1" }}>
          <h3>Users</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Quota</th>
                <th>Status</th>
                {isSuper && <th></th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.is_active === false ? "row-inactive" : ""}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`pill ${u.role === "super_admin" ? "gold" : u.role === "admin" ? "warn" : ""}`}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td>{u.plan}</td>
                  <td>{quotaLabel(u.daily_quota)}</td>
                  <td>
                    <span className={`pill ${u.is_active === false ? "muted" : ""}`}>
                      {u.is_active === false ? "disabled" : u.subscription?.status || "active"}
                    </span>
                  </td>
                  {isSuper && (
                    <td>
                      <div className="admin-actions">
                        <button className="btn outline" type="button" onClick={() => openEdit(u)}>
                          Edit
                        </button>
                        <button className="btn outline" type="button" disabled={busy} onClick={() => toggleActive(u)}>
                          {u.is_active === false ? "Enable" : "Disable"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && <p className="muted">No users found.</p>}
        </section>

        {isSuper && (creating || selected) && (
          <aside className="panel">
            <h3>{creating ? "Create user" : "Credentials & plan"}</h3>
            {!creating && selected && (
              <p className="muted">
                {selected.jobs_count} jobs · {selected.files_count} files
              </p>
            )}
            <form onSubmit={save}>
              <label className="field">Name</label>
              <input value={form.name} onChange={(e) => setField("name", e.target.value)} required />
              <label className="field">Email</label>
              <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} required />
              <label className="field">{creating ? "Password" : "New password"}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                minLength={creating ? 6 : undefined}
                required={creating}
                placeholder={creating ? "" : "Leave blank to keep"}
              />
              <div className="drawer-grid">
                <div>
                  <label className="field">Role</label>
                  <select value={form.role} onChange={(e) => setField("role", e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super admin</option>
                  </select>
                </div>
                <div>
                  <label className="field">Plan</label>
                  <select value={form.plan} onChange={(e) => setField("plan", e.target.value)}>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                </div>
                <div>
                  <label className="field">Daily quota</label>
                  <input
                    type="number"
                    value={form.daily_quota}
                    onChange={(e) => setField("daily_quota", e.target.value)}
                    min={0}
                  />
                </div>
                <div>
                  <label className="field">Subscription</label>
                  <select
                    value={form.subscription_status}
                    onChange={(e) => setField("subscription_status", e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="trialing">Trialing</option>
                    <option value="past_due">Past due</option>
                    <option value="paused">Paused</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>
              </div>
              <label className="field">Notes</label>
              <input value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
              <label className="field">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setField("is_active", e.target.checked)}
                />{" "}
                Account active
              </label>
              <div className="admin-actions" style={{ marginTop: 14 }}>
                <button className="btn accent" type="submit" disabled={busy}>
                  {creating ? "Create" : "Save changes"}
                </button>
                {!creating && (
                  <button className="btn outline" type="button" disabled={busy} onClick={resetPassword}>
                    Reset password
                  </button>
                )}
                <button
                  className="btn outline"
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setEditing(null);
                  }}
                >
                  Close
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>
    </main>
  );
}
