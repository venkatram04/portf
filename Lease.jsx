import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Lease = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    propertyId,
    tenantId: navTenantId,
    rentAmount: navRent,
  } = location.state || {};

  const [leaseID, setLeaseID] = useState("");
  const [propertyID, setPropertyID] = useState("");
  const [tenantID, setTenantID] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [status, setStatus] = useState("");
  const [leases, setLeases] = useState([]);
  const [token, setToken] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [interestID, setInterestID] = useState(null);
  const [interestStatus, setInterestStatus] = useState(null);

  // NEW: payment statuses map { leaseId: status }
  const [paymentStatuses, setPaymentStatuses] = useState({});

  const apiBase = "https://localhost:7067/api/Lease";
  const interestApi = "https://localhost:7067/api/Interest";
  const paymentApi = "https://localhost:7067/api/Payment";

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedTenantID = localStorage.getItem("tenantID");
    if (storedToken) setToken(storedToken);
    if (storedTenantID && !navTenantId) setTenantID(storedTenantID);
    setStartDate(new Date().toISOString().split("T")[0]);

    if (propertyId) setPropertyID(propertyId);
    if (navTenantId) setTenantID(navTenantId);
    if (navRent) setRentAmount(navRent);
  }, [propertyId, navTenantId, navRent]);

  useEffect(() => {
    if (token && tenantID) {
      handleRead();
      fetchInterestStatus();
    }
  }, [token, tenantID]);

  const fetchInterestStatus = async () => {
    try {
      const res = await fetch(`${interestApi}/tenant/${tenantID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const match = data.find((i) => i.propertyID === propertyID);
        if (match) {
          setInterestID(match.interestID);
          setInterestStatus(match.status);
        } else {
          setInterestStatus("None");
        }
      } else {
        setInterestStatus("Error");
      }
    } catch {
      setInterestStatus("Error");
    }
  };

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const showMessage = (type, text) => setMessage({ type, text });

  const mapError = (text, status, action) => {
    if (status === 401)
      return `${action} failed: Unauthorized. Please log in again.`;
    if (status === 404) return `${action} failed: Lease not found.`;
    if (status === 400 && text.includes("FOREIGN KEY"))
      return `${action} failed: Invalid Property ID or Tenant ID.`;
    if (text.includes("SqlException") || text.includes("SqlClient"))
      return `${action} failed: Database error.`;
    return `${action} failed: ${text}`;
  };

  const handleCreate = async () => {
    if (!propertyID || !tenantID || !startDate) {
      showMessage("danger", "Property ID, Tenant ID, and Start Date are required");
      return;
    }

    if (interestStatus !== "Approved") {
      showMessage("warning", "Lease creation blocked: Interest must be approved by owner.");
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
          interestID,
          startDate,
          endDate,
          rentAmount: parseFloat(rentAmount),
          status,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "Create"));
        return;
      }

      showMessage("success", "Lease created successfully");
      handleRead();
      resetForm();
    } catch (err) {
      showMessage("danger", `Create failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStatus = async (leaseId) => {
    try {
      const res = await fetch(`${paymentApi}/byLease/${leaseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const latest = data[data.length - 1];
        setPaymentStatuses((prev) => ({
          ...prev,
          [leaseId]: latest.status,
        }));
      } else {
        setPaymentStatuses((prev) => ({
          ...prev,
          [leaseId]: "Unpaid",
        }));
      }
    } catch {
      setPaymentStatuses((prev) => ({
        ...prev,
        [leaseId]: "Error",
      }));
    }
  };

  const handleRead = async () => {
    try {
      if (!tenantID) {
        showMessage("warning", "Tenant ID missing. Cannot fetch leases.");
        return;
      }
      setLoading(true);
      const response = await fetch(`${apiBase}/tenant/${tenantID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "Read"));
        return;
      }

      const data = await response.json();
      setLeases(data);

      // fetch payment status for each lease
      data.forEach((lease) => fetchPaymentStatus(lease.leaseID));

      if (data.length === 0) showMessage("info", "No leases found.");
      else setMessage(null);
    } catch (err) {
      showMessage("danger", `Read failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReadOne = async (id) => {
    try {
      const response = await fetch(`${apiBase}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
    if (!leaseID) {
      showMessage("warning", "Please select a lease to update");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/${leaseID}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          leaseID,
          propertyID,
          tenantID,
          interestID,
          startDate,
          endDate,
          rentAmount: parseFloat(rentAmount),
          status,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "Update"));
        return;
      }

      showMessage("success", "Lease updated");
      handleRead();
      resetForm();
    } catch (err) {
      showMessage("danger", `Update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this lease?")) return;
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "Delete"));
        return;
      }

      showMessage("success", "Lease deleted");
      handleRead();
    } catch (err) {
      showMessage("danger", `Delete failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

    const handleEditClick = (lease) => {
    setLeaseID(lease.leaseID);
    setPropertyID(lease.propertyID);
    setTenantID(lease.tenantID);
    setStartDate(lease.startDate.split("T")[0]);
    setEndDate(lease.endDate ? lease.endDate.split("T")[0] : "");
    setRentAmount(lease.rentAmount);
    setStatus(lease.status);
    setIsEditing(true);
    setMessage(null);
  };

  const resetForm = () => {
    setLeaseID("");
    setPropertyID(propertyId || "");
    setTenantID(navTenantId || tenantID || "");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setRentAmount(navRent || "");
    setStatus("");
    setIsEditing(false);
  };

  const calculateTotalRent = (lease) => {
    if (!lease.startDate) return lease.rentAmount;
    const start = new Date(lease.startDate);
    const end = lease.endDate ? new Date(lease.endDate) : null;

    let months = 1;
    if (end && end > start) {
      months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth()) +
        (end.getDate() >= start.getDate() ? 0 : -1);
      if (months < 1) months = 1;
    }
    return lease.rentAmount * months;
  };

  const handlePay = (lease) => {
  const totalRent = calculateTotalRent(lease);
  navigate(`/payments?leaseID=${lease.leaseID}&amount=${totalRent}&propertyID=${lease.propertyID}`);
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
          height: '103%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)', 
          zIndex: 0,
        }}
      />
  <div style={{ position: 'relative', zIndex: 1 }}></div>
      <div className="container pt-3 mt-3">
        <div className="card card-glass p-4">
          <h2 className="mb-3 text-center">Lease Management</h2>

          {message && (
            <div
              className={`alert alert-${message.type} inline-alert break-words`}
              role="alert"
            >
              {message.text}
            </div>
          )}

          {/* Interest Status Warning */}
          {interestStatus !== "Approved" && (
            <div className="alert alert-warning mb-3">
              You cannot create a lease until the owner approves your interest.
            </div>
          )}

          {/* Lease Form */}
          <div className="mb-3">
            <label className="form-label">Lease ID</label>
            <input
              type="text"
              className="form-control"
              value={leaseID}
              disabled={isEditing}
              onChange={(e) => setLeaseID(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Property ID</label>
            <input
              type="text"
              className="form-control"
              value={propertyID}
              disabled={isEditing}
              onChange={(e) => setPropertyID(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Tenant ID</label>
            <input
              type="text"
              className="form-control"
              value={tenantID}
              disabled={isEditing || !!tenantID}
              onChange={(e) => setTenantID(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              disabled={isEditing}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Rent Amount (per month)</label>
            <input
              type="number"
              className="form-control"
              value={rentAmount}
              min="0"
              onChange={(e) => setRentAmount(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Select Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>

          <div className="d-flex flex-wrap gap-2 mb-2">
            {!isEditing ? (
              <button
                className="btn btn-success"
                onClick={handleCreate}
                disabled={loading || interestStatus !== "Approved"}
              >
                {loading ? "Creating..." : "Create"}
              </button>
            ) : (
              <button
                className="btn btn-warning"
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update"}
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={handleRead}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh List"}
            </button>
            {isEditing && (
              <button
                className="btn btn-secondary"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {leases.length > 0 && (
          <div className="mt-4 mb-5">
            <div className="card card-glass">
              <div className="card-body p-4">
                <h4 className="section-title">Lease List</h4>
                <div className="table-scroll">
                  <table className="table table-bordered table-striped">
                    <thead className="table-dark">
                      <tr>
                        <th>Lease ID</th>
                        <th>Property ID</th>
                        <th>Tenant ID</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Total Rent</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leases.map((lease) => {
                        const totalRent = calculateTotalRent(lease);
                        const payStatus = paymentStatuses[lease.leaseID];
                        return (
                          <tr key={lease.leaseID}>
                            <td>{lease.leaseID}</td>
                            <td>{lease.propertyID}</td>
                            <td>{lease.tenantID}</td>
                            <td>
                              {lease.startDate
                                ? new Date(lease.startDate).toLocaleDateString()
                                : ""}
                            </td>
                            <td>
                              {lease.endDate
                                ? new Date(lease.endDate).toLocaleDateString()
                                : ""}
                            </td>
                            <td>{totalRent}</td>
                            <td>{lease.status}</td>
                            <td>
                              {lease.createdAt
                                ? new Date(lease.createdAt).toLocaleString()
                                : ""}
                            </td>
                            <td className="d-flex flex-wrap gap-2">
                              <button
                                className="btn btn-sm btn-warning"
                                onClick={() => handleEditClick(lease)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-info"
                                onClick={() => handleReadOne(lease.leaseID)}
                              >
                                View
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(lease.leaseID)}
                              >
                                Delete
                              </button>

                              {payStatus === "Paid" ? (
                                <button
                                  className="btn btn-sm btn-secondary"
                                  disabled
                                >
                                  Paid
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handlePay(lease)}
                                >
                                  Pay
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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

export default Lease;
 