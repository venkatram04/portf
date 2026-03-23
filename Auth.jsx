import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [rentalHistory, setRentalHistory] = useState("");
  const [image, setImage] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response;
      if (isLogin) {
        response = await fetch("https://localhost:7067/api/Auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      } else {
        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        formData.append("roleEnum", role);
        formData.append("name", name);
        formData.append("phoneNumber", phoneNumber);
        formData.append("contactDetails", contactDetails);
        formData.append("rentalHistory", rentalHistory);
        if (image) formData.append("image", image);

        response = await fetch("https://localhost:7067/api/Auth/register", {
          method: "POST",
          body: formData,
        });
      }

      const data = await response.json();

      if (!response.ok) {
        const msg =
          data.message ||
          data.title ||
          data.detail ||
          (data.errors && data.errors.join(", ")) ||
          "Something went wrong. Please try again.";
        throw new Error(msg);
      }

      if (isLogin) {
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("authEmail", data.email);
        localStorage.setItem("authRoles", JSON.stringify(data.roles));

        if (data.roles.includes("Owner") && data.ownerID) {
          localStorage.setItem("ownerID", data.ownerID);
        }
        if (data.roles.includes("Tenant") && data.tenantID) {
          localStorage.setItem("tenantID", data.tenantID);
        }

        navigate("/");
      } else {
        alert("Registration successful! Please log in.");
        setIsLogin(true);
        setEmail("");
        setPassword("");
        setRole("");
        setName("");
        setPhoneNumber("");
        setContactDetails("");
        setRentalHistory("");
        setImage(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
  className="py-5"
  style={{
    minHeight: '100vh',
    backgroundImage: `url('https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1974')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    marginTop: '-70px',   
    paddingTop: '70px',   
  }}
>
  <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '103%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 0,
        }}
      />
  <div style={{ position: 'relative', zIndex: 1 }}></div>
      <div
        className="container d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <div
          className="card shadow-lg border-0 rounded-3"
          style={{ width: "100%", maxWidth: "600px", padding: "2rem" }}
        >
          <h2 className="text-center mb-4">
            {isLogin ? "Login" : "Register"}
          </h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {!isLogin && (
              <>
                <div className="mb-3">
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select Role
                    </option>
                    <option value="Tenant">Tenant</option>
                    <option value="Owner">Owner</option>
                  </select>
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Contact Details"
                    value={contactDetails}
                    onChange={(e) => setContactDetails(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rental History"
                    value={rentalHistory}
                    onChange={(e) => setRentalHistory(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setImage(e.target.files[0])}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary w-100 fs-5"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Login"
                : "Register"}
            </button>
          </form>
          <div className="text-center mt-3">
            <button
              className="btn btn-link"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin
                ? "Don't have an account? Register"
                : "Already registered? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
