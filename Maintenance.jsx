import React, { useEffect, useState } from "react";

const Maintenance = () => {
  const [requestID, setRequestID] = useState("");
  const [propertyID, setPropertyID] = useState("");
  const [tenantID, setTenantID] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [status, setStatus] = useState("Pending");
  const [requests, setRequests] = useState([]);
  const [leasedProperties, setLeasedProperties] = useState([]);
  const [token, setToken] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const apiBase = "https://localhost:7067/api/MaintenanceRequest";
  const leaseApi = "https://localhost:7067/api/Lease";
  const propertyApi = "https://localhost:7067/api/Property";

  const roles = JSON.parse(localStorage.getItem("authRoles") || "[]");
  const isAdmin = roles.includes("Admin");
  const isTenantRole = roles.includes("Tenant");

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedTenantID = localStorage.getItem("tenantID");
    if (storedToken) setToken(storedToken);
    if (storedTenantID) setTenantID(storedTenantID);
  }, []);

  useEffect(() => {
    if (token) {
      handleRead();
      if (isTenantRole && tenantID) fetchLeasedProperties();
    }
  }, [token, tenantID]);

  const fetchLeasedProperties = async () => {
  try {
    const res = await fetch(`${leaseApi}/tenant/${tenantID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch leases");

    const leases = await res.json();

    // 🔍 Extract unique propertyIDs
    const uniquePropertyIDs = [...new Set(leases.map((l) => l.propertyID))];

    // 🔧 Fetch property details for each unique ID
    const enriched = await Promise.all(
      uniquePropertyIDs.map(async (id) => {
        const propRes = await fetch(`${propertyApi}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const property = propRes.ok ? await propRes.json() : {};
        return {
          propertyID: id,
          propertyName: property.propertyName || "Unnamed Property",
        };
      })
    );

    setLeasedProperties(enriched);
  } catch (err) {
    console.error("Failed to fetch distinct leased properties:", err);
  }
};


  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const showMessage = (type, text) => setMessage({ type, text });

  const mapError = (text, status, action) => {
    if (status === 401) return `${action} failed: Unauthorized. Please log in again.`;
    if (status === 404) return `${action} failed: Request not found.`;
    if (status === 400 && text.includes("FOREIGN KEY")) return `${action} failed: Invalid Property ID or Tenant ID.`;
    if (text.includes("SqlException") || text.includes("SqlClient")) return `${action} failed: Database error.`;
    return `${action} failed: ${text}`;
  };

  const handleCreate = async () => {
    if (!propertyID || !tenantID) {
      showMessage("danger", "Property ID and Tenant ID are required");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(apiBase, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          propertyID,
          tenantID,
          issueDescription,
          status: status || "Pending",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "Create"));
        return;
      }

      showMessage("success", "Maintenance request created successfully");
      handleRead();
      resetForm();
    } catch (err) {
      showMessage("danger", `Create failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async () => {
    try {
      setLoading(true);
      let url = apiBase;
      if (isTenantRole && tenantID) url = `${apiBase}/tenant/${tenantID}`;

      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "Read"));
        return;
      }

      const data = await response.json();
      setRequests(data);
      if (data.length === 0) showMessage("info", "No maintenance requests found.");
      else setMessage(null);
    } catch (err) {
      showMessage("danger", `Read failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReadOne = async (id) => {
    try {
      const response = await fetch(`${apiBase}/${id}`, { headers: { Authorization: `Bearer ${token}` } });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "View Details"));
        return;
      }

      const data = await response.json();
      showMessage("info", JSON.stringify(data, null, 2));
    } catch (err) {
      showMessage("danger", `View Details failed: ${err.message}`);
    }
  };

  const handleUpdate = async () => {
    if (!requestID) {
      showMessage("warning", "Please select a request to update");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/${requestID}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          propertyID,
          tenantID,
          issueDescription,
          status,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "Update"));
        return;
      }

      showMessage("success", "Maintenance request updated");
      handleRead();
      resetForm();
    } catch (err) {
      showMessage("danger", `Update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/${id}`, { method: "DELETE", headers: authHeaders });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "Delete"));
        return;
      }

      showMessage("success", "Maintenance request deleted");
      handleRead();
    } catch (err) {
      showMessage("danger", `Delete failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (req) => {
    setRequestID(req.requestID);
    setPropertyID(req.propertyID);
    setTenantID(req.tenantID);
    setIssueDescription(req.issueDescription);
    setStatus(req.status);
    setIsEditing(true);
    setMessage(null);
  };

  const resetForm = () => {
    setRequestID("");
    setPropertyID("");
    setTenantID("");
    setIssueDescription("");
    setStatus("Pending");
    setIsEditing(false);
  };

  return (
    <div className="py-5" style={{
      minHeight: '100vh',
      backgroundImage: `url('https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1974')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      marginTop: '-70px',
      paddingTop: '70px',
    }}>
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
      <div className="container pt-4 mt-4">
        <div className="card card-glass p-4">
          <h2 className="mb-3 text-center">Maintenance Requests</h2>

          {message && (
            <div className={`alert alert-${message.type} inline-alert break-words`} role="alert">
              {message.text}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Request ID</label>
            <input type="text" className="form-control" value={requestID} disabled={isEditing} onChange={(e) => setRequestID(e.target.value)} />
          </div>

                    <div className="mb-3">
            <label className="form-label">Property</label>
            {isTenantRole ? (
              <select
                className="form-select"
                value={propertyID}
                onChange={(e) => setPropertyID(e.target.value)}
                disabled={isEditing}
              >
                <option value="">Select Property</option>
                {leasedProperties.length > 0 ? (
                  leasedProperties.map((p) => (
                    <option key={p.propertyID} value={p.propertyID}>
                      {p.propertyID} - {p.propertyName}
                    </option>
                  ))
                ) : (
                  <option disabled>No leased properties found</option>
                )}
              </select>
            ) : (
              <input
                type="text"
                className="form-control"
                value={propertyID}
                disabled={isEditing}
                onChange={(e) => setPropertyID(e.target.value)}
              />
            )}
          </div>

          {!isTenantRole && (
            <div className="mb-3">
              <label className="form-label">Tenant ID</label>
              <input
                type="text"
                className="form-control"
                value={tenantID}
                disabled={isEditing}
                onChange={(e) => setTenantID(e.target.value)}
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Issue Description</label>
            <input
              type="text"
              className="form-control"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Status</label>
            <select className="form-select" disabled>
              <option value="Pending" disabled selected>
                Pending
              </option>
            </select>
          </div>

          <div className="d-flex flex-wrap gap-2 mb-2">
            {!isEditing ? (
              <button className="btn btn-success" onClick={handleCreate} disabled={loading}>
                {loading ? "Creating..." : "Create"}
              </button>
            ) : (
              <button className="btn btn-warning" onClick={handleUpdate} disabled={loading}>
                {loading ? "Updating..." : "Update"}
              </button>
            )}
            <button className="btn btn-primary" onClick={handleRead} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh List"}
            </button>
            {isEditing && (
              <button className="btn btn-secondary" onClick={resetForm} disabled={loading}>
                Cancel
              </button>
            )}
          </div>
        </div>

        {requests.length > 0 && (
          <div className="mt-4 mb-5">
            <div className="card card-glass">
              <div className="card-body p-4">
                <h4 className="section-title">Maintenance Request List</h4>
                <div className="table-scroll">
                  <table className="table table-bordered table-striped">
                    <thead className="table-dark">
                      <tr>
                        <th>Request ID</th>
                        <th>Property ID</th>
                        <th>Tenant ID</th>
                        <th>Issue Description</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req) => (
                        <tr key={req.requestID}>
                          <td>{req.requestID}</td>
                          <td>{req.propertyID}</td>
                          <td>{req.tenantID}</td>
                          <td>{req.issueDescription}</td>
                          <td>{req.status}</td>
                          <td>{req.createdAt ? new Date(req.createdAt).toLocaleString() : ""}</td>
                          <td className="d-flex gap-2 flex-wrap">
                            <button className="btn btn-sm btn-warning" onClick={() => handleEditClick(req)}>
                              Edit
                            </button>
                            <button className="btn btn-sm btn-info" onClick={() => handleReadOne(req.requestID)}>
                              View Details
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(req.requestID)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Maintenance;
