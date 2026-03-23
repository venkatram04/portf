import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Table, ButtonGroup, Image} from "react-bootstrap";

const AddOwner = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [image, setImage] = useState(null);
  const [contactDetails, setContactDetails] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [owners, setOwners] = useState([]);
  const [token, setToken] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const ownerApi = "https://localhost:7067/api/Owner";
  const authApi = "https://localhost:7067/api/Auth/register";

  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) setToken(storedToken);
  }, []);

  useEffect(() => {
    if (token) handleRead();
  }, [token]);

  const mapError = (text, status, action) => {
    if (status === 401)
      return `${action} failed: Unauthorized. Please log in again.`;
    if (status === 404) return `${action} failed: Owner not found.`;
    if (text.includes("SqlException") || text.includes("SqlClient"))
      return `${action} failed: Database error.`;
    return `${action} failed:\n${text}`;
  };

  const handleCreate = async () => {
    if (!name || !email || !password) {
      return alert("Name, Email, and Password are required");
    }

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("roleEnum", "Owner");
      formData.append("name", name);
      formData.append("phoneNumber", phoneNumber);
      formData.append("contactDetails", "");
      formData.append("rentalHistory", "");
      if (image) formData.append("image", image);

      const response = await fetch(authApi, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        alert(mapError(errorText, response.status, "Create"));
        return;
      }

      alert("Owner registered successfully.");
      handleRead();
      resetForm();
    } catch (err) {
      alert(`Create failed: ${err.message}`);
    }
  };

  const handleRead = async () => {
    try {
      const response = await fetch(ownerApi, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        alert(mapError(errorText, response.status, "Read"));
        return;
      }

      const data = await response.json();
      setOwners(data);
    } catch (err) {
      alert(`Read failed: ${err.message}`);
    }
  };

  const handleReadOne = async (id) => {
    try {
      const response = await fetch(`${ownerApi}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        alert(mapError(errorText, response.status, "View Details"));
        return;
      }

      const data = await response.json();
      alert(JSON.stringify(data, null, 2));
    } catch (err) {
      alert(`View Details failed:\n${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this owner?")) return;
    try {
      const response = await fetch(`${ownerApi}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        alert(mapError(errorText, response.status, "Delete"));
        return;
      }

      alert("Owner deleted");
      handleRead();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleUpdate = async () => {
    if (!ownerId) return alert("Please select an owner to update");

    try {
      const formData = new FormData();
      formData.append("Name", name);
      formData.append("Email", email);
      formData.append("PhoneNumber", phoneNumber);
      formData.append("ContactDetails", contactDetails);
      if (image) formData.append("Image", image);

      const response = await fetch(`${ownerApi}/${ownerId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        alert(mapError(errorText, response.status, "Update"));
        return;
      }

      alert("Owner updated");
      handleRead();
      resetForm();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleEditClick = (owner) => {
    setOwnerId(owner.ownerID);
    setName(owner.name);
    setEmail(owner.email);
    setPhoneNumber(owner.phoneNumber || "");
    setImage(null);
    setIsEditing(true);
  };

  const resetForm = () => {
    setOwnerId("");
    setName("");
    setEmail("");
    setPassword("");
    setPhoneNumber("");
    setImage(null);
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
      <Container className="py-5 pt-5 mt-5">
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <Card className="shadow-lg border-0 rounded-3 card-glass">
              <Card.Header
                as="h2"
                className="text-center bg-dark text-white p-3"
              >
                Owner Management
              </Card.Header>
              <Card.Body className="p-4 p-md-5">
                <Form>
                  <Row>
                    <Col md={isEditing ? 3 : 12}>
                      <Form.Group className="mb-3" controlId="ownerId">
                        <Form.Label>Owner ID</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder={
                            isEditing
                              ? "Editing..."
                              : "Enter ID for details/delete"
                          }
                          value={ownerId}
                          readOnly={isEditing}
                          onChange={(e) => setOwnerId(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={isEditing ? 3 : 6}>
                      <Form.Group className="mb-3" controlId="ownerName">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter owner's name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={isEditing ? 3 : 6}>
                      <Form.Group className="mb-3" controlId="ownerEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="Enter owner's email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isEditing}
                        />
                      </Form.Group>
                    </Col>
                    {!isEditing && (
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="ownerPassword">
                          <Form.Label>Password</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    )}
                    <Col md={isEditing ? 3 : 6}>
                      <Form.Group className="mb-3" controlId="ownerPhone">
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter owner's phone number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={isEditing ? 3 : 6}>
                      <Form.Group className="mb-3" controlId="ownerContactDetails">
                        <Form.Label>Contact Details</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter owner's contact details"
                          value={contactDetails}
                          onChange={(e) => setContactDetails(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="mb-3" controlId="ownerImage">
                        <Form.Label>Profile Image</Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImage(e.target.files[0])}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-flex justify-content-end gap-2 mt-3">
                    {!isEditing ? (
                      <Button variant="success" onClick={handleCreate}>
                        Create
                      </Button>
                    ) : (
                      <Button variant="warning" onClick={handleUpdate}>
                        Update
                      </Button>
                    )}
                    <Button variant="primary" onClick={handleRead}>
                      Refresh List
                    </Button>
                    {isEditing && (
                      <Button variant="secondary" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="justify-content-center mt-5 mb-5 pb-5">
          <Col lg={10} xl={8}>
            <Card
              className="shadow-lg border-0 rounded-3"
              style={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
            >
              <Card.Body className="p-4 p-md-5">
                <h3 className="mb-3 text-center">Owner List</h3>
                <Table striped bordered hover responsive className="shadow-sm">
                  <thead className="table-dark">
                    <tr>
                      <th>Owner ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Contact Details</th>
                      <th>Image</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {owners.length > 0 ? (
                      owners.map((owner) => (
                        <tr key={owner.ownerID}>
                          <td>{owner.ownerID}</td>
                          <td>{owner.name}</td>
                          <td>{owner.email}</td>
                          <td>{owner.phoneNumber || "-"}</td>
                          <td>{owner.contactDetails || "-"}</td>
                          <td className="text-center">
                            {owner.imageBase64 ? (
                              <Image
                                src={`data:${owner.imageContentType};base64,${owner.imageBase64}`}
                                alt={owner.name}
                                roundedCircle
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <span className="text-muted">No Image</span>
                            )}
                          </td>
                          <td className="text-center">
                            <ButtonGroup size="sm">
                              <Button
                                variant="outline-warning"
                                onClick={() => handleEditClick(owner)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline-info"
                                onClick={() => handleReadOne(owner.ownerID)}
                              >
                                View
                              </Button>
                              <Button
                                variant="outline-danger"
                                onClick={() => handleDelete(owner.ownerID)}
                              >
                                Delete
                              </Button>
                            </ButtonGroup>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">
                          No owners found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AddOwner;