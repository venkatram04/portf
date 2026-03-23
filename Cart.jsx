import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("authToken");
  const apiBase = "https://localhost:7067/api/cart";
  const propertyApi = "https://localhost:7067/api/Property";
  const imageApi = "https://localhost:7067/api/Image/property";
  const ownerApi = "https://localhost:7067/api/Owner";

  const navigate = useNavigate();

  const fetchCartWithDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiBase, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      const cartItems = data.items || [];

      const detailedItems = await Promise.all(
        cartItems.map(async (item) => {
          try {
            const propRes = await fetch(`${propertyApi}/${item.propertyId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const prop = await propRes.json();

            let ownerName = "Unknown owner";
            if (prop.ownerID) {
              const ownerRes = await fetch(`${ownerApi}/${prop.ownerID}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (ownerRes.ok) {
                const owner = await ownerRes.json();
                ownerName = owner.name || ownerName;
              }
            }

            const imgRes = await fetch(`${imageApi}/${item.propertyId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const imgs = await imgRes.json();
            const firstImage = imgs.length > 0 ? imgs[0] : null;

            const availabilityStatus =
              typeof prop.status === "string"
                ? prop.status
                : prop.availabilityStatus
                ? "Available"
                : "Occupied";

            return {
              ...item,
              ownerName,
              propertyName: prop.propertyName,
              rentAmount: prop.rentAmount,
              availabilityStatus,
              imageSrc: firstImage
                ? `data:${firstImage.contentType};base64,${firstImage.base64Data}`
                : null,
            };
          } catch {
            return item;
          }
        })
      );

      setItems(detailedItems);
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartWithDetails();
  }, []);

  useEffect(() => {
    setTotal(items.reduce((sum, i) => sum + (i.rentAmount || 0), 0));
  }, [items]);

  const removeFromCart = async (id) => {
    try {
      const res = await fetch(`${apiBase}/remove/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Error removing from cart:", err);
    }
  };

  const handleLease = (item) => {
    if (String(item.availabilityStatus).toLowerCase() !== "available") {
      alert("This property is currently leased and unavailable.");
      return;
    }
    navigate("/lease", {
      state: {
        propertyID: item.propertyId,
        rentAmount: item.rentAmount,
      },
    });
  };

  const imageStyle = {
    height: "150px",
    objectFit: "cover",
    width: "100%",
    borderRadius: "6px",
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

      <div className="container pt-5">
        <div
          className="card shadow-lg border-0 rounded-3 mb-4"
          style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
        >
          <div className="card-body py-4">
            <h2 className="text-center text-success mb-0">Your Cart</h2>
          </div>
        </div>

        {loading && <p className="text-white">Loading cart...</p>}
        {!loading && items.length === 0 && (
          <div
            className="card shadow-lg border-0 rounded-3 mb-4"
            style={{ backgroundColor: "#fff" }}
          >
            <div className="card-body py-4">
              <p className="text-center text-black mb-0">No items in cart</p>
            </div>
          </div>
        )}
        {items.map((item) => {
          const isOccupied =
            String(item.availabilityStatus || "").toLowerCase() !== "available";

          return (
            <div
              key={item.id}
              className="card shadow-lg border-0 rounded-3 mb-4"
              style={{ backgroundColor: "#fff" }}
            >
              <div className="card-body p-3">
                {item.imageSrc && (
                  <img
                    src={item.imageSrc}
                    alt={item.propertyName}
                    style={imageStyle}
                  />
                )}
                <div className="mt-3">
                  <p>
                    <strong>Owner name:</strong> {item.ownerName}
                  </p>
                  <p>
                    <strong>Property name:</strong> {item.propertyName}
                  </p>
                  <p>
                    <strong>Amount:</strong> ₹{item.rentAmount}
                  </p>
                  <p>
                    <strong>Status:</strong> {item.availabilityStatus}
                  </p>
                </div>

                <div className="d-flex gap-3 mt-3">
                  <button
                    className="btn btn-danger btn-lg w-50"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove from Cart
                  </button>
                  <button
                    className="btn btn-success btn-lg w-50"
                    onClick={() =>
                      navigate("/lease", {
                        state: {
                          propertyId: item.propertyId,
                          rentAmount: item.price || item.rentAmount,
                          tenantId: localStorage.getItem("authTenantId"),
                        },
                      })
                    }
                  >
                    Lease it
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {total > 0 && (
          <div
            className="mt-4 card shadow-lg border-0 rounded-3"
            style={{ backgroundColor: "#fff" }}
          >
            <div className="card-body p-3">
              <h4>Total: ₹{total}</h4>
              <p className="text-muted">
                Proceed to lease each property individually using the "Lease it"
                button above.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
