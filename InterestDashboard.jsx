import React, { useEffect, useState } from "react";

export default function InterestDashboard() {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);

  const token = localStorage.getItem("authToken");
  const ownerID = localStorage.getItem("ownerID");

  const interestApi = "https://localhost:7067/api/Interest";
  const tenantApi = "https://localhost:7067/api/Tenant";
  const propertyApi = "https://localhost:7067/api/Property";

  const showMessage = (type, text) => setMessage({ type, text });

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        setLoading(true);

        const propRes = await fetch(`${propertyApi}/owner/${ownerID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!propRes.ok) throw new Error("Failed to fetch properties");
        const properties = await propRes.json();

        const allInterests = [];
        const tenantMap = {};
        const propertyMap = {};

        for (const prop of properties) {
          propertyMap[prop.propertyID] = prop.propertyName || "Unknown Property";

          const intRes = await fetch(`${interestApi}/property/${prop.propertyID}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (intRes.ok) {
            const interests = await intRes.json();

            for (const i of interests) {
              if (!tenantMap[i.tenantID]) {
                const tRes = await fetch(`${tenantApi}/${i.tenantID}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (tRes.ok) {
                  const tenant = await tRes.json();
                  tenantMap[i.tenantID] = tenant; // ✅ store full tenant object
                }
              }

              allInterests.push({
                ...i,
                tenant: tenantMap[i.tenantID], // ✅ full tenant object
                tenantName: tenantMap[i.tenantID]?.name || "Unknown Tenant",
                propertyName: propertyMap[i.propertyID],
              });
            }
          }
        }

        setInterests(allInterests);
      } catch (err) {
        showMessage("danger", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, [token, ownerID]);

  const updateStatus = async (interestID, status) => {
    try {
      const res = await fetch(`${interestApi}/${interestID}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());

      setInterests((prev) =>
        prev.map((i) =>
          i.interestID === interestID ? { ...i, status } : i
        )
      );
      showMessage("success", `Interest ${status.toLowerCase()} successfully.`);
    } catch (err) {
      showMessage("danger", `Update failed: ${err.message}`);
    }
  };

  return (
  <div
    className="py-5"
    style={{
      minHeight: "100vh",
      backgroundImage: `url('https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1974')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      marginTop: "-70px", 
      paddingTop: "70px", 
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
    <div className="container mt-4">
      <div className="card shadow-lg border-0 rounded-3">
        <div className="card-body p-4 p-md-5">
          <h3 className="text-center text-primary mb-4">Tenant Interests</h3>

          {message && (
            <div className={`alert alert-${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="text-center text-muted">Loading interests...</div>
          ) : interests.length === 0 ? (
            <p className="text-center text-muted">No interests found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Property</th>
                    <th>Tenant</th>
                    <th>Status</th>
                    <th>Tenant Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interests.map((i) => (
                    <tr key={i.interestID}>
                      <td>{i.propertyName}</td>
                      <td>{i.tenantName}</td>
                      <td>{i.status}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => setSelectedTenant(i.tenant)}
                        >
                          View
                        </button>
                      </td>
                      <td>
                        {i.status === "I'm Interested" ? (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() =>
                                updateStatus(i.interestID, "Approved")
                              }
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() =>
                                updateStatus(i.interestID, "Rejected")
                              }
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedTenant && (
            <div className="modal fade show d-block" tabIndex="-1" role="dialog">
              <div className="modal-dialog" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Tenant Details</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setSelectedTenant(null)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p>
                      <strong>Name:</strong> {selectedTenant.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedTenant.email}
                    </p>
                    <p>
                      <strong>Mobile:</strong> {selectedTenant.phoneNumber}
                    </p>
                    <p>
                      <strong>Tenant ID:</strong> {selectedTenant.tenantID}
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedTenant(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}