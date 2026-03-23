import React, { useState, useEffect } from "react";

export default function Profile() {
  const [showToken, setShowToken] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [extraData, setExtraData] = useState([]); // properties for Owner, leases for Tenant
  const [token, setToken] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiBase = "https://localhost:7067/api";

  // Step 1: Load token details
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    setToken(storedToken);

    if (!storedToken) {
      setMessage({
        type: "warning",
        text: "No auth token found. Please log in.",
      });
      setLoading(false);
      return;
    }

    fetch(`${apiBase}/Auth/token-details`, {
      method: "GET",
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch token details");
        return res.json();
      })
      .then((data) => {
        const roles = Array.isArray(data.roles) ? data.roles : data.Roles || [];

        let userIdLabel = "User ID";
        let userId = data.userId || "N/A";

        if (roles.includes("Owner")) {
          userIdLabel = "Owner ID";
          userId = data.ownerID || data.userId || "N/A";
        } else if (roles.includes("Tenant")) {
          userIdLabel = "Tenant ID";
          userId = data.tenantID || data.userId || "N/A";
        }

        setUserDetails({
          userIdLabel,
          userId,
          email: data.email || "Unknown",
          roles: roles.length > 0 ? roles.join(", ") : "No roles assigned",
          rolesArray: roles,
        });
        setMessage(null);
      })
      .catch((err) => {
        setMessage({ type: "danger", text: "Failed to load profile details." });
        console.error("Profile fetch error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // Step 2: Fetch full Owner/Tenant profile
  useEffect(() => {
    if (!userDetails || !token) return;

    const fetchProfile = async () => {
      try {
        let url = null;
        if (userDetails.rolesArray.includes("Owner")) {
          url = `${apiBase}/Owner/${userDetails.userId}`;
        } else if (userDetails.rolesArray.includes("Tenant")) {
          url = `${apiBase}/Tenant/${userDetails.userId}`;
        }

        if (url) {
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const profileData = await res.json();
            setUserDetails((prev) => ({
              ...prev,
              name: profileData.name,
              phoneNumber: profileData.phoneNumber,
              contactDetails: profileData.contactDetails,
              rentalHistory: profileData.rentalHistory,
              imageBase64: profileData.imageBase64,
              imageContentType: profileData.imageContentType,
            }));
          }
        }
      } catch (err) {
        console.error("Full profile fetch error:", err);
      }
    };

    fetchProfile();
  }, [userDetails?.userId, userDetails?.rolesArray, token]);

  // Step 3: Fetch extra data (properties for Owner, leases for Tenant)
  useEffect(() => {
    if (!userDetails || !token) return;

    const fetchExtra = async () => {
      try {
        if (userDetails.rolesArray.includes("Owner")) {
          const res = await fetch(
            `${apiBase}/Property/owner/${userDetails.userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (res.ok) setExtraData(await res.json());
        } else if (userDetails.rolesArray.includes("Tenant")) {
          const res = await fetch(
            `${apiBase}/Lease/tenant/${userDetails.userId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (res.ok) setExtraData(await res.json());
        }
      } catch (err) {
        console.error("Extra data fetch error:", err);
      }
    };

    fetchExtra();
  }, [userDetails, token]);

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
    <div className="container pt-3 mt-3">
      <div className="card card-glass p-4">
        <h2 className="mb-3">User Profile</h2>

        {message && (
          <div
            className={`alert alert-${message.type} inline-alert`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="text-center my-3 text-muted">Loading profile...</div>
        ) : userDetails ? (
          <>
            {/* Profile Image with fallback */}
            <div className="text-center mb-3">
              <img
                src={
                  userDetails.imageBase64
                    ? `data:${userDetails.imageContentType};base64,${userDetails.imageBase64}`
                    : "/images/dummy-profile.png" 
                }
                alt={userDetails.name || "User"}
                className="rounded-circle"
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Common Fields */}
            <p>
              <strong>{userDetails.userIdLabel}:</strong> {userDetails.userId}
            </p>
            <p>
              <strong>Name:</strong> {userDetails.name || "Not provided"}
            </p>
            <p>
              <strong>Email:</strong> {userDetails.email}
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              {userDetails.phoneNumber || "Not provided"}
            </p>
            <p>
              <strong>Contact Details:</strong>{" "}
              {userDetails.contactDetails || "Not provided"}
            </p>
            <p>
              <strong>Rental History:</strong>{" "}
              {userDetails.rentalHistory || "Not provided"}
            </p>
            <p>
              <strong>Roles:</strong> {userDetails.roles}
            </p>

            <button
              className="btn btn-primary mt-2"
              onClick={() => setShowToken(!showToken)}
            >
              {showToken ? "Hide Token" : "View Token"}
            </button>

            {showToken && (
              <div className="alert alert-info mt-3 break-words">
                <strong>Token:</strong> {token}
              </div>
            )}

            {/* extra section for Owner or Tenant */}
            {userDetails.rolesArray.includes("Owner") && (
              <div className="mt-4">
                <h4>Your Properties</h4>
                {extraData.length > 0 ? (
                  <ul className="list-group">
                    {extraData.map((p) => (
                      <li key={p.propertyID} className="list-group-item">
                        <strong>{p.propertyName}</strong> — {p.address} (₹
                        {p.rentAmount})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No properties found.</p>
                )}
              </div>
            )}

            {userDetails.rolesArray.includes("Tenant") && (
              <div className="mt-4">
                <h4>Your Leases</h4>
                {extraData.length > 0 ? (
                  <ul className="list-group">
                    {extraData.map((l) => (
                      <li key={l.leaseID} className="list-group-item">
                        Lease #{l.leaseID} — Property:{" "}
                        {l.propertyName || l.propertyID}, Rent: ₹{l.rentAmount}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No leases found.</p>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
    </div>
  );
}
