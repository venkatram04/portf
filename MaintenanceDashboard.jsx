import React, { useEffect, useState } from "react";

const MaintenanceDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [token, setToken] = useState("");
  const [ownerID, setOwnerID] = useState("");
  const [statusUpdate, setStatusUpdate] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const apiBase = "https://localhost:7067/api/MaintenanceRequest";

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedOwnerID = localStorage.getItem("ownerID");
    if (storedToken) setToken(storedToken);
    if (storedOwnerID) setOwnerID(storedOwnerID);
  }, []);

  useEffect(() => {
    if (token && ownerID) {
      fetchRequests();
    }
  }, [token, ownerID]);

  const showMessage = (type, text) => setMessage({ type, text });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/owner/${ownerID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", `Failed to fetch requests: ${errorText}`);
        return;
      }

      const data = await response.json();
      setRequests(data);
      if (data.length === 0) showMessage("info", "No maintenance requests found.");
      else setMessage(null);
    } catch (err) {
      showMessage("danger", `Error fetching requests: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setStatusUpdate((prev) => ({ ...prev, [id]: newStatus }));
  };

  const handleUpdateStatus = async (req) => {
    const updatedStatus = statusUpdate[req.requestID] || req.status;
    setSavingId(req.requestID);
    try {
      const response = await fetch(`${apiBase}/${req.requestID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          propertyID: req.propertyID,
          tenantID: req.tenantID,
          issueDescription: req.issueDescription,
          status: updatedStatus,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", `Update failed: ${errorText}`);
        return;
      }

      showMessage("success", "Status updated successfully");
      fetchRequests();
    } catch (err) {
      showMessage("danger", `Error updating status: ${err.message}`);
    } finally {
      setSavingId(null);
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
    <div className="container pt-3 mt-3">
      <div className="card card-glass p-4">
        <h2 className="mb-3 text-center">Owner Maintenance Dashboard</h2>

        {message && (
          <div className={`alert alert-${message.type} inline-alert break-words`} role="alert">
            {message.text}
          </div>
        )}

        {loading ? (
          <div className="text-center my-4 text-muted">Loading...</div>
        ) : requests.length === 0 ? (
          <p className="text-muted text-center">No maintenance requests found.</p>
        ) : (
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
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.requestID}>
                    <td>{req.requestID}</td>
                    <td>{req.propertyID}</td>
                    <td>{req.tenantID}</td>
                    <td>{req.issueDescription}</td>
                    <td>
                      <select
                        className="form-select"
                        value={statusUpdate[req.requestID] || req.status}
                        onChange={(e) => handleStatusChange(req.requestID, e.target.value)}
                        disabled={savingId === req.requestID}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td>{new Date(req.createdAt).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleUpdateStatus(req)}
                        disabled={savingId === req.requestID}
                      >
                        {savingId === req.requestID ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default MaintenanceDashboard;
