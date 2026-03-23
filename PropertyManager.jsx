import React, { useState, useEffect } from "react";

export default function PropertyManager() {
  const [propertyID, setPropertyID] = useState("");
  const [ownerID, setOwnerID] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState(""); // "true" | "false" | ""
  const [properties, setProperties] = useState([]);
  const [token, setToken] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [imageFiles, setImageFiles] = useState([]); // multiple files

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const apiBase = "https://localhost:7067/api/Property";
  const imageApiBase = "https://localhost:7067/api/Image";

  const ownerIDFromStorage = localStorage.getItem("ownerID");
  const ownerPropertyApi = ownerIDFromStorage
    ? `https://localhost:7067/api/Property/owner/${ownerIDFromStorage}`
    : null;

  const roles = JSON.parse(localStorage.getItem("authRoles") || "[]");
  const isOwner = roles.includes("Owner");

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) setToken(storedToken);
    else
      setMessage({
        type: "warning",
        text: "No login token found. Please log in first.",
      });

    const storedOwnerID = localStorage.getItem("ownerID");
    if (storedOwnerID) setOwnerID(storedOwnerID);
  }, []);

  useEffect(() => {
    if (token) handleRead();
  }, [token]);

  useEffect(() => {
    // If you navigate with state to edit a property
    const navState = history.state?.usr?.property;
    if (navState) {
      handleEditClick(navState);
      window.history.replaceState({}, document.title);
    }
  }, []);

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const showMessage = (type, text) => setMessage({ type, text });

  const mapError = (text, status, action) => {
    if (status === 401)
      return `${action} failed: Unauthorized. Please log in again.`;
    if (status === 404) return `${action} failed: Property ID not found.`;
    if (status === 400 && text.includes("FOREIGN KEY"))
      return `${action} failed: Owner ID not found.`;
    if (text.includes("SqlException") || text.includes("SqlClient"))
      return `${action} failed: Database error.`;
    return `${action} failed: ${text}`;
  };

  const handleCreate = async () => {
    if (!ownerID || !propertyName) {
      showMessage("danger", "Owner ID and Property Name are required");
      return;
    }

    try {
      setLoading(true);
      const createResponse = await fetch(apiBase, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          ownerID,
          propertyName,
          description,
          address,
          rentAmount: parseFloat(rentAmount),
          availabilityStatus: availabilityStatus === "true",
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        showMessage(
          "danger",
          mapError(errorText, createResponse.status, "Create")
        );
        return;
      }

      const createdProperty = await createResponse.json();
      showMessage(
        "success",
        `Property created with ID: ${createdProperty.propertyID}`
      );

      // Upload multiple images
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const formData = new FormData();
          formData.append("File", file);
          formData.append("PropertyID", createdProperty.propertyID);

          const uploadResponse = await fetch(`${imageApiBase}/upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          if (!uploadResponse.ok) {
            const uploadError = await uploadResponse.text();
            showMessage(
              "danger",
              mapError(uploadError, uploadResponse.status, "Image Upload")
            );
          } else {
            showMessage("success", `Image "${file.name}" uploaded successfully`);
          }
        }
      }

      await handleRead();
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
      const endpoint = isOwner && ownerPropertyApi ? ownerPropertyApi : apiBase;
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage("danger", mapError(errorText, response.status, "Read"));
        return;
      }

      const data = await response.json();

      const withImages = await Promise.all(
        data.map(async (prop) => {
          try {
            const imgRes = await fetch(
              `${imageApiBase}/property/${prop.propertyID}`
            );
            if (imgRes.ok) {
              const imgs = await imgRes.json();
              return { ...prop, images: imgs };
            }
          } catch {
            // ignore image failures
          }
          return { ...prop, images: [] };
        })
      );

      setProperties(withImages);
      if (withImages.length === 0)
        showMessage("info", "No properties found.");
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
        showMessage(
          "danger",
          mapError(errorText, response.status, "View Details")
        );
        return;
      }

      const data = await response.json();
      showMessage("info", JSON.stringify(data, null, 2));
    } catch (err) {
      showMessage("danger", `View Details failed: ${err.message}`);
    }
  };

  const handleUpdate = async () => {
    if (!propertyID) {
      showMessage("warning", "Please select a property to update");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/${propertyID}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          propertyID,
          ownerID,
          propertyName,
          description,
          address,
          rentAmount: parseFloat(rentAmount),
          availabilityStatus: availabilityStatus === "true",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage(
          "danger",
          mapError(errorText, response.status, "Update")
        );
        return;
      }

      showMessage("success", "Property updated");
      handleRead();
      resetForm();
    } catch (err) {
      showMessage("danger", `Update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this property?"))
      return;
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (!response.ok) {
        const errorText = await response.text();
        showMessage(
          "danger",
          mapError(errorText, response.status, "Delete")
        );
        return;
      }

      showMessage("success", "Property deleted");
      handleRead();
    } catch (err) {
      showMessage("danger", `Delete failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (property) => {
    setPropertyID(property.propertyID);
    setOwnerID(property.ownerID);
    setPropertyName(property.propertyName || "");
    setDescription(property.description || "");
    setAddress(property.address);
    setRentAmount(property.rentAmount);
    setAvailabilityStatus(property.availabilityStatus ? "true" : "false");
    setIsEditing(true);
    setMessage(null);
  };

    const handleUploadImage = async () => {
    if (!propertyID) {
      showMessage("warning", "Please select a property before uploading images");
      return;
    }
    if (imageFiles.length === 0) {
      showMessage("warning", "Please select one or more image files");
      return;
    }

    try {
      setLoading(true);
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append("File", file);
        formData.append("PropertyID", propertyID);

        const response = await fetch(`${imageApiBase}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const text = await response.text();
        if (!response.ok) {
          showMessage("danger", mapError(text, response.status, "Image Upload"));
        } else {
          showMessage("success", `Image "${file.name}" uploaded successfully`);
        }
      }
      setImageFiles([]);
      handleRead();
    } catch (err) {
      showMessage("danger", `Image Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPropertyID("");
    setOwnerID(ownerIDFromStorage || "");
    setPropertyName("");
    setDescription("");
    setAddress("");
    setRentAmount("");
    setAvailabilityStatus("");
    setImageFiles([]);
    setIsEditing(false);
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
        <h2 className="mb-3 text-center">Property Management</h2>

        {message && (
          <div
            className={`alert alert-${message.type} inline-alert break-words`}
            role="alert"
          >
            {message.text}
          </div>
        )}

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
          <label className="form-label">Owner ID</label>
          <input
            type="text"
            className="form-control bg-light"
            value={ownerID}
            disabled={isEditing || !!ownerID}
            readOnly
            onChange={(e) => setOwnerID(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Property Name</label>
          <input
            type="text"
            className="form-control"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
          />
        </div>

            <div className="mb-3">
      <label className="form-label">Description</label>
      <textarea
        className="form-control"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Enter a brief description of the property"
      />
    </div>

        <div className="mb-3">
          <label className="form-label">Address</label>
          <input
            type="text"
            className="form-control"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Rent Amount</label>
          <input
            type="number"
            className="form-control"
            value={rentAmount}
            onChange={(e) => setRentAmount(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Availability Status</label>
          <select
            className="form-select"
            value={availabilityStatus}
            onChange={(e) => setAvailabilityStatus(e.target.value)}
          >
            <option value="">Select Status</option>
            <option value="true">Available</option>
            <option value="false">Occupied</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Upload Images</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            multiple
            onChange={(e) => setImageFiles(Array.from(e.target.files))}
          />
          <button
            className="btn btn-outline-dark mt-2"
            onClick={handleUploadImage}
            disabled={imageFiles.length === 0 || !propertyID || loading}
          >
            {loading ? "Uploading..." : "Upload Images"}
          </button>
        </div>

        <div className="d-flex flex-wrap gap-2 mb-2">
          {!isEditing ? (
            <button
              className="btn btn-success"
              onClick={handleCreate}
              disabled={loading}
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

      {properties.length > 0 && (
        <div className="mt-4 mb-5">
          <div className="card card-glass">
            <div className="card-body p-4">
              <h4 className="section-title">Property List</h4>
              <div className="table-scroll">
                <table className="table table-bordered table-striped">
                  <thead className="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Owner ID</th>
                      <th>Property Name</th>
                      <th>Description</th>
                      <th>Address</th>
                      <th>Rent</th>
                      <th>Status</th>
                      <th>Image</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property) => (
                      <tr key={property.propertyID}>
                        <td>{property.propertyID}</td>
                        <td>{property.ownerID}</td>
                        <td>{property.propertyName}</td>
                        <td>{property.description}</td>
                        <td>{property.address}</td>
                        <td>{property.rentAmount}</td>
                        <td>
                          {property.availabilityStatus
                            ? "Available"
                            : "Occupied"}
                        </td>
                        <td>
                          {property.images && property.images.length > 0 ? (
                            <img
                              src={`data:${property.images[0].contentType};base64,${property.images[0].base64Data}`}
                              alt={property.images[0].fileName}
                              style={{
                                width: "80px",
                                height: "80px",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <span>No Image</span>
                          )}
                        </td>
                        <td className="d-flex gap-2 flex-wrap">
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleEditClick(property)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-info"
                            onClick={() => handleReadOne(property.propertyID)}
                          >
                            View Details
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(property.propertyID)}
                          >
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
}
