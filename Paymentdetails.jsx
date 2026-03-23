import React, { useState } from "react";
import { Card } from "react-bootstrap";

const Paymentdetails = () => {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);

  const token = localStorage.getItem("authToken");
  const tenantID = localStorage.getItem("tenantID");
  const apiBase = "https://localhost:7067/api/Payment";

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const getPaymentsByTenantID = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/byTenant/${tenantID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPayments(data);
      if (data.length === 0) showMessage("info", "No payments found for this tenant.");
      else setMessage(null);
    } catch (err) {
      showMessage("danger", `Error: ${err.message}`);
    } finally {
      setLoading(false);
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
          height: '103%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)', 
          zIndex: 0,
        }}
      />
  <div style={{ position: 'relative', zIndex: 1 }}></div>
      <div className="container mt-4">
        <Card className="shadow-lg border-0 rounded-3">
          <Card.Body className="p-4 p-md-5">
            <h4 className="mb-4">Tenant Payment History</h4>

            {message && (
              <div className={`alert alert-${message.type} mt-2`}>
                {message.text}
              </div>
            )}

            <button
              className="btn btn-primary mb-4"
              onClick={getPaymentsByTenantID}
              disabled={loading}
            >
              {loading ? "Loading..." : "Get My Payment Details"}
            </button>

            {payments.length > 0 && (
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Payment ID</th>
                      <th>Lease ID</th>
                      <th>Amount</th>
                      <th>Payment Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.paymentID}>
                        <td>{p.paymentID}</td>
                        <td>{p.leaseID}</td>
                        <td>{p.amount}</td>
                        <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                        <td>{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Paymentdetails;
