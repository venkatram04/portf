import React, { useEffect, useState } from "react";

const Tenant = () => {
  const [tenants, setTenants] = useState([]);
  const [tenantID, setTenantID] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [rentalHistory, setRentalHistory] = useState("");
  const [image, setImage] = useState(null);

  const [token, setToken] = useState("");
  const [roles, setRoles] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const tenantApi = "https://localhost:7067/api/Tenant";
  const authApi = "https://localhost:7067/api/Auth/register";

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedRoles = JSON.parse(localStorage.getItem("authRoles") || "[]");
    if (storedToken) setToken(storedToken);
    if (storedRoles) setRoles(storedRoles);
  }, []);

  useEffect(() => {
    if (token) handleRead();
  }, [token]);

  const showMessage = (type, text) => setMessage({ type, text });

  const mapError = (text, status, action) => {
    if (status === 401)
      return `${action} failed: Unauthorized. Please log in again.`;
    if (status === 404) return `${action} failed: Tenant ID not found.`;
    if (text.includes("SqlException") || text.includes("SqlClient"))
      return `${action} failed: Database error.`;
    return `${action} failed: ${text}`;
  };

  const buildFormData = () => {
    const formData = new FormData();
    formData.append("Name", name);
    formData.append("Email", email);
    formData.append("PhoneNumber", phoneNumber);
    formData.append("ContactDetails", contactDetails);
    formData.append("RentalHistory", rentalHistory);
    if (image) formData.append("Image", image);
    return formData;
  };

  const handleRead = async () => {
    try {
      setLoading(true);
      const response = await fetch(tenantApi, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "Read"));
        return;
      }
      const data = await response.json();
      setTenants(data);

      if (data.length === 0) showMessage("info", "No tenants found.");
      else setMessage(null);
    } catch (err) {
      showMessage("danger", `Read failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name || !email || !password) {
      showMessage("warning", "Name, Email, and Password are required");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("roleEnum", "Tenant");
      formData.append("name", name);
      formData.append("phoneNumber", phoneNumber);
      formData.append("contactDetails", contactDetails);
      formData.append("rentalHistory", rentalHistory);
      if (image) formData.append("image", image);

      const response = await fetch(authApi, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "Create"));
        return;
      }

      showMessage("success", "Tenant registered successfully");
      handleRead();
      resetForm();
    } catch (err) {
      showMessage("danger", `Create failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!tenantID) {
      showMessage("warning", "Please select a tenant to update");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${tenantApi}/${tenantID}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: buildFormData(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "Update"));
        return;
      }

      showMessage("success", "Tenant updated");
      handleRead();
      resetForm();
    } catch (err) {
      showMessage("danger", `Update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tenant?")) return;
    try {
      setLoading(true);
      const response = await fetch(`${tenantApi}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "Delete"));
        return;
      }
      showMessage("success", "Tenant deleted");
      handleRead();
    } catch (err) {
      showMessage("danger", `Delete failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (tenant) => {
    setTenantID(tenant.tenantID);
    setName(tenant.name || "");
    setEmail(tenant.email || "");
    setPhoneNumber(tenant.phoneNumber || "");
    setContactDetails(tenant.contactDetails || "");
    setRentalHistory(tenant.rentalHistory || "");
    setIsEditing(true);
    setMessage(null);
  };

  const resetForm = () => {
    setTenantID("");
    setName("");
    setEmail("");
    setPassword("");
    setPhoneNumber("");
    setContactDetails("");
    setRentalHistory("");
    setImage(null);
    setIsEditing(false);
  };

  const canManage = roles.includes("Admin") || roles.includes("Owner");
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
        <h2 className="mb-3 text-center">Tenant Management</h2>

        {message && (
          <div
            className={`alert alert-${message.type} inline-alert break-words`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        {canManage && (
          <>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isEditing}
              />
            </div>
            {!isEditing && (
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Contact Details</label>
              <input
                type="text"
                className="form-control"
                value={contactDetails}
                onChange={(e) => setContactDetails(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Rental History</label>
              <input
                type="text"
                className="form-control"
                value={rentalHistory}
                onChange={(e) => setRentalHistory(e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Profile Image</label>
              <input
                type="file"
                className="form-control"
                onChange={(e) => setImage(e.target.files[0])}
              />
            </div>
            <div className="d-flex gap-2">
              <button
                className={`btn ${isEditing ? "btn-warning" : "btn-success"}`}
                onClick={isEditing ? handleUpdate : handleCreate}
                disabled={loading}
              >
                {loading
                  ? isEditing
                    ? "Updating..."
                    : "Creating..."
                  : isEditing
                  ? "Update"
                  : "Create"}
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
          </>
        )}

        {tenants.length > 0 ? (
          <div className="mt-4 mb-5">
            <div className="card card-glass">
              <div className="card-body p-4">
                <h4 className="section-title">Tenant List</h4>
                <div className="table-scroll">
                  <table className="table table-bordered table-striped">
                    <thead className="table-dark">
                      <tr>
                        <th>Tenant ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Contact Details</th>
                        <th>Rental History</th>
                        <th>Image</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenants.map((tenant) => (
                        <tr key={tenant.tenantID}>
                          <td>{tenant.tenantID}</td>
                          <td>{tenant.name}</td>
                          <td>{tenant.email}</td>
                          <td>{tenant.phoneNumber}</td>
                          <td>{tenant.contactDetails}</td>
                          <td>{tenant.rentalHistory}</td>
                          <td className="text-center">
                            {tenant.imageBase64 ? (
                              <img
                                src={`data:${tenant.imageContentType};base64,${tenant.imageBase64}`}
                                alt={tenant.name}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  objectFit: "cover",
                                  borderRadius: "50%",
                                }}
                              />
                            ) : (
                              <span className="text-muted">No Image</span>
                            )}
                          </td>
                          <td className="d-flex flex-wrap gap-2">
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => handleEditClick(tenant)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() =>
                                showMessage(
                                  "info",
                                  JSON.stringify(tenant, null, 2)
                                )
                              }
                            >
                              View
                            </button>
                            {canManage && (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(tenant.tenantID)}
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted mt-4">No tenants found.</p>
        )}
      </div>
    </div>
  </div>
);
}

export default Tenant;