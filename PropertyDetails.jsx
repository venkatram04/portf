import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AppNavbar from "../components/Navbar";

export default function PropertyDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [property, setProperty] = useState(location.state?.property || null);
  const [images, setImages] = useState([]);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const token = localStorage.getItem("authToken");
  const roles = JSON.parse(localStorage.getItem("authRoles") || "[]");
  const tenantId = localStorage.getItem("tenantID"); // ✅ fixed key
  const isTenant = roles.includes("Tenant");
  const isOwner = roles.includes("Owner");
  const isAdmin = roles.includes("Admin");

  const cartApi = "https://localhost:7067/api/Cart";
  const propertyApi = "https://localhost:7067/api/Property";
  const imageApi = "https://localhost:7067/api/Image/property";
  const ownerApi = "https://localhost:7067/api/Owner";
  const interestApi = "https://localhost:7067/api/Interest";

  const [inCart, setInCart] = useState(false);
  const [cartItemId, setCartItemId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [manualImageSelection, setManualImageSelection] = useState(false);
  const [interestStatus, setInterestStatus] = useState(null);
  const [interestId, setInterestId] = useState(null);

  const showMessage = (type, text) => setMessage({ type, text });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        let prop = property;
        if (!prop && id) {
          const res = await fetch(`${propertyApi}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to fetch property");
          prop = await res.json();
          setProperty(prop);
        }

        if (prop) {
          const imgRes = await fetch(`${imageApi}/${prop.propertyID}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (imgRes.ok) setImages(await imgRes.json());

          const ownerRes = await fetch(`${ownerApi}/${prop.ownerID}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (ownerRes.ok) setOwner(await ownerRes.json());

          if (isTenant && tenantId) {
            const cartRes = await fetch(cartApi, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (cartRes.ok) {
              const cartData = await cartRes.json();
              const existingItem = cartData.items.find(
                (ci) => ci.propertyId === prop.propertyID
              );
              if (existingItem) {
                setInCart(true);
                setCartItemId(existingItem.id);
              }
            }

            const interestRes = await fetch(`${interestApi}/tenant/${tenantId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (interestRes.ok) {
              const interests = await interestRes.json();
              const match = interests.find((i) => i.propertyID === prop.propertyID);
              if (match) {
                setInterestStatus(match.status);
                setInterestId(match.interestID);
              }
            }
          }
        }
      } catch (err) {
        showMessage("danger", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, property, token, isTenant]);

  useEffect(() => {
    if (images.length > 1 && !manualImageSelection) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [images, manualImageSelection]);

  const handleCart = async () => {
    if (!isTenant) {
      showMessage("warning", "Only tenants can add properties to cart.");
      return;
    }
    try {
      setActionLoading(true);

      if (inCart) {
        const res = await fetch(`${cartApi}/remove/${cartItemId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        setInCart(false);
        setCartItemId(null);
        showMessage("success", "Removed from cart.");
      } else {
        const res = await fetch(`${cartApi}/add`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            propertyId: property.propertyID,
            price: property.rentAmount || 0,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const addedItem = await res.json();
        setInCart(true);
        setCartItemId(addedItem.id);
        showMessage("success", "Added to cart!");
      }
    } catch (err) {
      showMessage("danger", `Cart action failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLease = () => {
    if (!isTenant) {
      showMessage("warning", "Only tenants can lease properties.");
      return;
    }

    navigate("/lease", {
      state: {
        propertyId: property.propertyID,
        rentAmount: property.rentAmount,
        tenantId,
      },
    });
  };

  const handleInterest = async () => {
    if (!tenantId) {
      showMessage("danger", "Tenant ID missing. Please log in again.");
      return;
    }

    try {
      const res = await fetch(`${interestApi}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantID: tenantId,
          propertyID: property.propertyID,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setInterestStatus(data.status);
      setInterestId(data.interestID);
      showMessage("success", "Interest submitted to owner.");
    } catch (err) {
      showMessage("danger", `Interest failed: ${err.message}`);
    }
  };

  const isLeased =
    String(property.status || "").toLowerCase() === "leased" ||
    property.availabilityStatus === false;

  if (loading)
    return <div className="container content-padding">Loading property...</div>;
  if (!property)
    return (
      <div className="container content-padding">
        No property data available
      </div>
    );

  return (
  <div className="page-bg" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
    <AppNavbar />
    <div className="content-padding container" style={{ flex: 1 }}>
      {message && (
        <div className={`alert alert-${message.type} inline-alert`} role="alert">
          {message.text}
        </div>
      )}

      <div className="position-relative mb-3" style={{ height: "48vh" }}>
        {images.length > 0 ? (
          <div className="carousel-container position-relative h-100">
            <img
              src={`data:${images[currentImageIndex].contentType};base64,${images[currentImageIndex].base64Data}`}
              alt={property.propertyName}
              className="w-100 h-100"
              style={{
                objectFit: "cover",
                borderRadius: "10px",
                transition: "opacity 0.8s ease-in-out",
              }}
            />
            <div className="position-absolute bottom-0 start-0 p-3 bg-dark bg-opacity-50 text-white w-100">
              <h2 className="mb-1">{property.propertyName}</h2>
              <p className="mb-0">
                ₹{property.rentAmount} • {isLeased ? "Leased" : "Available"}
              </p>
            </div>

            {/* Dots on image */}
            <div
              className="position-absolute bottom-0 start-50 translate-middle-x mb-2 d-flex"
              style={{ gap: "6px" }}
            >
              {images.map((_, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    setManualImageSelection(true);
                  }}
                  style={{
                    height: "8px",
                    width: "8px",
                    borderRadius: "50%",
                    backgroundColor:
                      index === currentImageIndex ? "#ffffff" : "#888",
                    boxShadow: "0 0 2px rgba(0,0,0,0.5)",
                    cursor: "pointer",
                    transition: "background-color 0.3s ease",
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div
            className="d-flex align-items-center justify-content-center bg-light"
            style={{ height: "48vh", borderRadius: "10px" }}
          >
            No Image Available
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="row g-4 mb-3">
        {/* Left column: Property details */}
        <div className="col-md-8">
          <div className="card card-glass p-4 h-100">
            <h4>Property Details</h4>
            <p>
              <strong>Address:</strong> {property.address}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {property.description || "No description available"}
            </p>

            {/* Tenant actions */}
            {isTenant && (
              <div className="mt-3 btn-gap">
                {isLeased ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() => alert("This property is already leased.")}
                  >
                    Leased
                  </button>
                ) : (
                  <div className="d-flex flex-column align-items-start">
                    <div className="mb-2">
                      <button
                        className={`btn ${inCart ? "btn-danger" : "btn-primary"}`}
                        onClick={handleCart}
                        disabled={actionLoading}
                      >
                        {inCart ? "Remove from Cart" : "Add to Cart"}
                      </button>
                    </div>

                    <div className="mb-2">
                      <button
                        className="btn btn-success"
                        onClick={handleLease}
                        disabled={actionLoading}
                      >
                        Lease it
                      </button>
                    </div>

                    <div>
                      {interestStatus === "Approved" ? (
                        <button className="btn btn-success" disabled>Approved</button>
                      ) : interestStatus === "Rejected" ? (
                        <button className="btn btn-danger" disabled>Rejected</button>
                      ) : interestStatus === "I'm Interested" ? (
                        <button className="btn btn-warning" disabled>Waiting for Approval</button>
                      ) : (
                        <button className="btn btn-info" onClick={handleInterest}>
                          Mark as Interested
                        </button>
                      )}
                    </div>
                  </div>

                )}
              </div>
            )}

            {/* Owner actions */}
            {isOwner && (
              <button
                className="btn btn-warning mt-3"
                onClick={() =>
                  navigate("/propertyManager", { state: { property } })
                }
              >
                Edit Property
              </button>
            )}

            {/* Admin actions */}
            {isAdmin && (
              <div className="d-flex gap-2 mt-3">
                <button
                  className="btn btn-warning"
                  onClick={() =>
                    navigate("/propertyManager", { state: { property } })
                  }
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger"
                  onClick={async () => {
                    try {
                      const res = await fetch(
                        `${propertyApi}/${property.propertyID}`,
                        {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      );
                      if (!res.ok) throw new Error(await res.text());
                      showMessage("success", "Property deleted successfully.");
                      navigate("/");
                    } catch (err) {
                      showMessage("danger", `Delete failed: ${err.message}`);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Owner details */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header">Owner Details</div>
            <div className="card-body text-center">
              <img
                src={
                  owner?.imageBase64
                    ? `data:${owner.imageContentType};base64,${owner.imageBase64}`
                    : "/images/dummy-profile.png"
                }
                alt={owner?.name || "Owner"}
                className="rounded-circle mb-3"
                style={{
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                  display: "block",
                  margin: "0 auto",
                }}
              />
              <h5 className="card-title">{owner?.name}</h5>
              <p className="card-text">{owner?.email}</p>
              <p className="card-text">
                {owner?.phoneNumber || "Not provided"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}