import React from 'react';
import { Container, Row, Col, Card, ListGroup } from 'react-bootstrap';

export default function Contact() {
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
      {/* Spacer to push content below fixed navbar */}
      <div style={{ height: '250px' }}></div>

      <Container>
        <Row className="justify-content-center">
          <Col md={10}>
            <Card className="shadow-lg border-0 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 1)' }}>
              <Card.Body className="p-4 p-md-5">
                <Card.Title as="h2" className="mb-3">Contact Us</Card.Title>
                <Card.Text className="text-dark">
                  We'd love to hear from you! Whether you have questions about our Property Management System, need support, or want to explore collaboration opportunities, feel free to reach out.
                </Card.Text>
                <ListGroup variant="flush" className="mb-3">
                  <ListGroup.Item className="text-dark">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:support@property.com">support@property.com</a>
                  </ListGroup.Item>
                  <ListGroup.Item className="text-dark">
                    <strong>Phone:</strong> +91-9xxxx-xxxx
                  </ListGroup.Item>
                  <ListGroup.Item className="text-dark">
                    <strong>Location:</strong> Hyderabad, Telangana, India
                  </ListGroup.Item>
                </ListGroup>
                <Card.Text className="text-dark">
                  Our support team is available Monday to Friday, 9 AM to 6 PM IST. You can also use our <a href="/contact-form">contact form</a> to send us a message directly.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
