"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

type AuthPanelProps = {
  onClose: () => void;
};

export default function AuthPanel({ onClose }: AuthPanelProps) {
  const { refreshProfile, supabase, user } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const response =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName || email
              }
            }
          });

    setSubmitting(false);

    if (response.error) {
      setMessage(response.error.message);
      return;
    }

    await refreshProfile();
    setMessage(mode === "sign-in" ? "Connexion réussie." : "Compte créé. Vérifie tes emails si Supabase demande confirmation.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    onClose();
  }

  return (
    <div className="account-panel">
      <div className="account-panel-header">
        <div>
          <div className="account-eyebrow">Espace joueur</div>
          <h2>{user ? "Mon espace" : mode === "sign-in" ? "Connexion" : "Créer un compte"}</h2>
        </div>
        <button className="icon-text-btn" onClick={onClose}>
          Fermer
        </button>
      </div>

      {user ? (
        <div className="account-content">
          <div className="account-row">
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
          <div className="account-row">
            <span>Statut</span>
            <strong>Connecté</strong>
          </div>
          <p className="account-muted">Les scores, séries et classements seront branchés ici à la prochaine étape.</p>
          <button className="secondary-btn" onClick={signOut}>
            Se déconnecter
          </button>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          {mode === "sign-up" ? (
            <label>
              Nom affiché
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Tarik" />
            </label>
          ) : null}
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </label>
          <button className="primary-btn" disabled={submitting}>
            {submitting ? "..." : mode === "sign-in" ? "Se connecter" : "Créer le compte"}
          </button>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setMessage("");
            }}
          >
            {mode === "sign-in" ? "Créer un compte" : "J'ai déjà un compte"}
          </button>
          {message ? <p className="auth-message">{message}</p> : null}
        </form>
      )}
    </div>
  );
}
