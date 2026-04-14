import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("shopper@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel narrow">
      <h2>Login</h2>
      <p>Use the seeded admin credentials above, or log in with a shopper account you already registered.</p>
      <form className="stack" onSubmit={handleSubmit}>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
        </label>
        {error && <p className="error-banner">{error}</p>}
        <button className="button" disabled={submitting} type="submit">
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
};

