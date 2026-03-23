import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [cards, setCards] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const token = localStorage.getItem("authToken");
  const roles = JSON.parse(localStorage.getItem("authRoles") || "[]");
  const ownerID = localStorage.getItem("ownerID");
  const tenantID = localStorage.getItem("tenantID");
  const navigate = useNavigate();

  const isTenant = roles.includes("Tenant");
  const isOwner = roles.includes("Owner");
  const isAdmin = roles.includes("Admin");

  const showMessage = (type, text) => setMessage({ type, text });

  const fetchAll = async () => {
    try {
      setLoading(true);
      let cartData = { items: [] };
      let interests = [];

      if (isTenant && tenantID) {
        const cartRes = await fetch("https://localhost:7067/api/Cart", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cartRes.ok) {
          cartData = await cartRes.json();
          setCartItems(cartData.items || []);
        }

        const interestRes = await fetch(`https://localhost:7067/api/Interest/tenant/${tenantID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (interestRes.ok) {
          interests = await interestRes.json();
        }
      }

      const imgRes = await fetch("https://localhost:7067/api/Image/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const images = imgRes.ok ? await imgRes.json() : [];

      const propRes = await fetch(
        isOwner
          ? `https://localhost:7067/api/Property/owner/${ownerID}`
          : "https://localhost:7067/api/Property",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!propRes.ok) throw new Error("Failed to fetch properties");
      const properties = await propRes.json();

      const ownerMap = {};
      await Promise.all(
        [...new Set(properties.map((p) => p.ownerID))].map(async (id) => {
          const res = await fetch(`https://localhost:7067/api/Owner/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          ownerMap[id] = res.ok ? (await res.json()).name : "Unknown owner";
        })
      );

      const merged = properties.map((prop) => {
        const img = images.find((i) => i.propertyID === prop.propertyID);
        const interest = interests.find((i) => i.propertyID === prop.propertyID);
        const interestStatus = interest?.status || null;
        const interestId = interest?.interestID || null;

        const inCartMatch = cartData.items?.find(
          (ci) => ci.propertyId === prop.propertyID || ci.propertyID === prop.propertyID
        );
        const inCart = !!inCartMatch;
        const cartItemId = inCartMatch?.id || null;

        const rawStatus = String(prop.status || "").toLowerCase();
        const isUnavailable = rawStatus === "leased" || rawStatus === "occupied";
        const statusValue = isUnavailable
          ? "Leased"
          : prop.availabilityStatus === true
          ? "Available"
          : "Occupied";

        return {
          propertyID: prop.propertyID,
          imageSrc: img ? `data:${img.contentType};base64,${img.base64Data}` : null,
          ownerName: ownerMap[prop.ownerID] || "Unknown owner",
          propertyName: prop.propertyName || "N/A",
          rentAmount: prop.rentAmount ?? 0,
          status: statusValue,
          isUnavailable,
          inCart,
          cartItemId,
          interestStatus,
          interestId,
          fullProperty: prop,
        };
      });

      setCards(merged);
      setMessage(null);
    } catch (err) {
      showMessage("danger", `Error fetching data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAll();
  }, [token]);

  const toggleCart = async (propertyID, inCart, cartItemId) => {
    const card = cards.find((c) => c.propertyID === propertyID);
    if (!card || card.isUnavailable) {
      showMessage("warning", "This property is already leased.");
      return;
    }

    

    try {
      if (!inCart) {
        const res = await fetch("https://localhost:7067/api/Cart/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            propertyId: propertyID,
            price: card?.rentAmount || 0,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const addedItem = await res.json();

        setCards((prev) =>
          prev.map((c) =>
            c.propertyID === propertyID
              ? { ...c, inCart: true, cartItemId: addedItem.id }
              : c
          )
        );
        setCartItems((prev) => [...prev, addedItem]);
        if (card.interestStatus !== "Approved") {
      showMessage("warning", "Interest must be approved to buy this property.");
       }
       else{ 
        showMessage("success", "Property added to cart!");
       }
      } else {
        if (!cartItemId) throw new Error("Missing cart item id for removal");

        const res = await fetch(`https://localhost:7067/api/Cart/remove/${cartItemId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());

        setCards((prev) =>
          prev.map((c) =>
            c.propertyID === propertyID
              ? { ...c, inCart: false, cartItemId: null }
              : c
          )
        );
        setCartItems((prev) => prev.filter((ci) => ci.id !== cartItemId));
        showMessage("success", "Property removed from cart.");
      }
    } catch (err) {
      showMessage("danger", `Cart action failed: ${err.message}`);
    }
  };
    const deleteProperty = async (propertyID) => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    try {
      const res = await fetch(`https://localhost:7067/api/Property/${propertyID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAll();
      showMessage("success", "Property deleted successfully.");
    } catch (err) {
      showMessage("danger", `Delete failed: ${err.message}`);
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
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)', 
          zIndex: 0,
        }}
      />
  <div style={{ position: 'relative', zIndex: 1 }}></div>
 
  <div className="page-bg pb-5 mb-4 pt-3">
    <div className="content-padding container">
      <div className="card card-glass mb-4">
        <div className="card-body py-4">
          <h3 className="text-center text-success mb-0">
            {isTenant
              ? "All Available Properties"
              : isOwner
              ? "My Properties"
              : isAdmin
              ? "All Properties (Admin)"
              : "Properties"}
          </h3>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type} inline-alert`} role="alert">
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center text-muted">Loading properties...</div>
      ) : cards.length === 0 ? (
        <p className="text-center text-muted">No properties available.</p>
      ) : (
        <div className="row g-4">
          {cards.map((card) => (
            <div className="col-md-4 col-lg-3" key={card.propertyID}>
              <div
                className="card h-100 border shadow-lg"
                style={{ borderRadius: "12px", cursor: "pointer" }}
                onClick={() =>
                  navigate(`/property/${card.propertyID}`, {
                    state: { property: card.fullProperty },
                  })
                }
              >
                {card.imageSrc ? (
                  <img
                    src={card.imageSrc}
                    alt={card.propertyName}
                    style={{
                      height: "180px",
                      objectFit: "cover",
                      width: "100%",
                      borderRadius: "12px",
                    }}
                  />
                ) : (
                  <div
                    className="d-flex align-items-center justify-content-center bg-light"
                    style={{ height: "180px" }}
                  >
                    No Image
                  </div>
                )}

                <div className="card-body text-center">
                  <h5 className="card-title">{card.propertyName}</h5>
                  <p className="mb-1">
                    <strong>Owner:</strong> {card.ownerName}
                  </p>
                  <p className="mb-1">
                    <strong>Rent:</strong> ₹{card.rentAmount}
                  </p>
                  <p className="mb-2">
                    <strong>Status:</strong> {card.status}
                  </p>

                  <div className="d-flex flex-column align-items-center">
                    {isTenant && (
                      <div className="mt-2 d-flex flex-column align-items-center">
                        {card.status === "Occupied" || card.status === "Leased" ? (
                          <button className="btn btn-secondary" disabled>
                            Leased
                          </button>
                        ) : (
                          <>
                            <button
                              className={`btn ${
                                card.inCart ? "btn-warning" : "btn-primary"
                              } mt-2`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCart(card.propertyID, card.inCart, card.cartItemId);
                              }}
                            >
                              {card.inCart ? "Remove from Cart" : "Add to Cart"}
                            </button>

                            {card.interestStatus === "Approved" ? (
                              <button className="btn btn-success mt-2" disabled>
                                Approved
                              </button>
                            ) : card.interestStatus === "Rejected" ? (
                              <button className="btn btn-danger mt-2" disabled>
                                Rejected
                              </button>
                            ) : card.interestStatus === "I'm Interested" ? (
                              <button className="btn btn-warning mt-2" disabled>
                                Waiting for Approval
                              </button>
                            ) : (
                              <button
                                className="btn btn-info mt-2"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const res = await fetch("https://localhost:7067/api/Interest", {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        Authorization: `Bearer ${token}`,
                                      },
                                      body: JSON.stringify({
                                        tenantID: tenantID,
                                        propertyID: card.propertyID,
                                      }),
                                    });
                                    if (!res.ok) throw new Error(await res.text());
                                    const data = await res.json();
                                    setCards((prev) =>
                                      prev.map((c) =>
                                        c.propertyID === card.propertyID
                                          ? {
                                              ...c,
                                              interestStatus: data.status,
                                              interestId: data.interestID,
                                            }
                                          : c
                                      )
                                    );
                                    showMessage("success", "Interest submitted to owner.");
                                  } catch (err) {
                                    showMessage("danger", `Interest failed: ${err.message}`);
                                  }
                                }}
                              >
                                Mark as Interested
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {isOwner && (
                      <button
                        className="btn btn-warning mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/propertyManager", {
                            state: { property: card.fullProperty },
                          });
                        }}
                      >
                        Edit Property
                      </button>
                    )}

                    {isAdmin && (
                      <div className="d-flex gap-2 mt-2">
                        <button
                          className="btn btn-warning"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/propertyManager", {
                              state: { property: card.fullProperty },
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProperty(card.propertyID);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
  </div>
);

}
