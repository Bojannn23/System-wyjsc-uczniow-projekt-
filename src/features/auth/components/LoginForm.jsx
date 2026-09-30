import React, { useState } from "react";
import { BsEnvelope, BsEye, BsEyeSlash, BsKey } from "react-icons/bs";

const LoginForm = ({ email, password, error, isSubmitting, onEmailChange, onPasswordChange, onSubmit }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
  <form onSubmit={onSubmit}>
    <div className="mb-4">
      <label htmlFor="login-email" className="form-label text-uppercase small fw-bold mb-2" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
        Adres E-mail
      </label>
      <div className="input-group">
        <span className="input-group-text bg-white border-end-0 text-muted px-3" style={{ borderTopLeftRadius: "0.5rem", borderBottomLeftRadius: "0.5rem" }}>
          <BsEnvelope size={18} />
        </span>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          className="form-control border-start-0 ps-1 py-2 shadow-none"
          placeholder="j.nowak@szkolnywezel.pl"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          style={{ borderTopRightRadius: "0.5rem", borderBottomRightRadius: "0.5rem", borderColor: "#dee2e6" }}
          required
        />
      </div>
    </div>

    {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}

    <div className="mb-4">
      <label htmlFor="login-password" className="form-label text-uppercase small fw-bold mb-2" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
        Hasło
      </label>
      <div className="input-group">
        <span className="input-group-text bg-white border-end-0 text-muted px-3" style={{ borderTopLeftRadius: "0.5rem", borderBottomLeftRadius: "0.5rem" }}>
          <BsKey size={18} />
        </span>
        <input
          id="login-password"
          type={isPasswordVisible ? "text" : "password"}
          autoComplete="current-password"
          className="form-control border-start-0 border-end-0 ps-1 py-2 shadow-none"
          placeholder="••••••••••••"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          style={{ borderColor: "#dee2e6" }}
          required
        />
        <button
          type="button"
          className="input-group-text bg-white text-muted px-3"
          style={{ borderTopRightRadius: "0.5rem", borderBottomRightRadius: "0.5rem", borderColor: "#dee2e6" }}
          onClick={() => setIsPasswordVisible((visible) => !visible)}
          aria-label={isPasswordVisible ? "Ukryj hasło" : "Pokaż hasło"}
          aria-pressed={isPasswordVisible}
        >
          {isPasswordVisible ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
        </button>
      </div>
    </div>

    <button type="submit" className="btn w-100 py-3 mb-3 fw-semibold text-white rounded-3 shadow-sm" style={{ backgroundColor: "#332f2c" }} disabled={isSubmitting}>
      {isSubmitting ? "Logowanie..." : "Wejdź do systemu"}
    </button>

    <div className="d-flex justify-content-between align-items-center mt-2">
      <a href="#" className="text-decoration-underline small fw-semibold" style={{ color: "#8b5cf6" }}>
        Zapomniałeś hasła?
      </a>
    </div>
  </form>
  );
};

export default LoginForm;
