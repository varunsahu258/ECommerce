import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await register(email, password);
      navigate("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel narrow">
      <h2>Create account</h2>
      <p>Shoppers register as regular users. Admin access comes from the seeded demo account.</p>
      <form className="stack" onSubmit={handleSubmit}>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            minLength={8}
            required
          />
        </label>
        {error && <p className="error-banner">{error}</p>}
        <button className="button" disabled={submitting} type="submit">
          {submitting ? "Creating..." : "Create account"}
        </button>
      </form>
    </section>
  );
};

