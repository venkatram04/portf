import React, { useEffect, useState } from "react";

const OwnerTenants = () => {
  const [token, setToken] = useState("");
  const [ownerID, setOwnerID] = useState("");
  const [tenantLeases, setTenantLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const propertyApi = "https://localhost:7067/api/Property";
  const leaseApi = "https://localhost:7067/api/Lease";
  const tenantApi = "https://localhost:7067/api/Tenant";

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedOwnerID = localStorage.getItem("ownerID");
    if (storedToken) setToken(storedToken);
    if (storedOwnerID) setOwnerID(storedOwnerID);
  }, []);

  useEffect(() => {
    if (token && ownerID) fetchTenantLeaseDetails();
  }, [token, ownerID]);

  const fetchTenantLeaseDetails = async () => {
    try {
      setLoading(true);
      const propRes = await fetch(`${propertyApi}/owner/${ownerID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!propRes.ok) throw new Error("Failed to fetch properties");

      const properties = await propRes.json();
      const allLeases = [];

      for (const property of properties) {
        const leaseRes = await fetch(`${leaseApi}/property/${property.propertyID}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!leaseRes.ok) continue;

        const leases = await leaseRes.json();

        for (const lease of leases) {
          const tenantRes = await fetch(`${tenantApi}/${lease.tenantID}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const tenant = tenantRes.ok ? await tenantRes.json() : {};

          allLeases.push({
            propertyName: property.propertyName,
            propertyAddress: property.address,
            tenantName: tenant.name,
            tenantEmail: tenant.email,
            tenantContact: tenant.phoneNumber,
            leaseStart: lease.startDate,
            leaseEnd: lease.endDate,
            rent: lease.rentAmount,
            status: lease.status,
          });
        }
      }

      setTenantLeases(allLeases);
      if (allLeases.length === 0) {
        setMessage({ type: "info", text: "No tenants found for your properties." });
      } else {
        setMessage(null);
      }
    } catch (err) {
      setMessage({ type: "danger", text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5" style={{
      minHeight: "100vh",
      backgroundImage: `url('https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1974')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      marginTop: "-70px",
      paddingTop: "70px",
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
          <h2 className="mb-3 text-center">Tenant Lease Overview</h2>

          {message && (
            <div className={`alert alert-${message.type} break-words`} role="alert">
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="text-center text-muted">Loading tenant data...</div>
          ) : tenantLeases.length > 0 ? (
            <div className="table-responsive mt-3">
              <table className="table table-bordered table-striped">
                <thead className="table-dark">
                  <tr>
                    <th>Tenant Name</th>
                    <th>Email</th>
                    <th>Contact</th>
                    <th>Property</th>
                    <th>Address</th>
                    <th>Lease Start</th>
                    <th>Lease End</th>
                    <th>Rent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tenantLeases.map((entry, index) => (
                    <tr key={index}>
                      <td>{entry.tenantName}</td>
                      <td>{entry.tenantEmail}</td>
                      <td>{entry.tenantContact}</td>
                      <td>{entry.propertyName}</td>
                      <td>{entry.propertyAddress}</td>
                      <td>{entry.leaseStart ? new Date(entry.leaseStart).toLocaleDateString() : "N/A"}</td>
                      <td>{entry.leaseEnd ? new Date(entry.leaseEnd).toLocaleDateString() : "N/A"}</td>
                      <td>₹{entry.rent}</td>
                      <td>{entry.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default OwnerTenants;
