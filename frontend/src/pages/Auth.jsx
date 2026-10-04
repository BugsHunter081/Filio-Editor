import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Auth() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();
  const [params] = useSearchParams();

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") await login(email, password);
      else await register({ email, name, password });
      nav(params.get("next") || "/account");
    } catch (ex) {
      setErr(ex.message);
    }
  };

  return (
    <main className="shell auth-wrap">
      <div className="card">
        <h1 className="serif">{mode === "login" ? "Welcome back" : "Create an account"}</h1>
        <p className="muted">Optional — guests can still run tools. Accounts keep job history.</p>
        <div className="tabs">
          <button className={mode === "login" ? "btn" : "btn outline"} type="button" onClick={() => setMode("login")}>
            Sign in
          </button>
          <button className={mode === "register" ? "btn" : "btn outline"} type="button" onClick={() => setMode("register")}>
            Register
          </button>
        </div>
        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <label className="field">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </>
          )}
          <label className="field">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="field">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {err && <div className="err">{err}</div>}
          <button className="btn accent" style={{ width: "100%", marginTop: 16 }} type="submit">
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
