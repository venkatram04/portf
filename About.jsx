import React from 'react';
import { Container, Row, Col, Card, ListGroup, Image } from 'react-bootstrap';

export default function About() {
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

      <div style={{ height: '150px' }}></div>
      <Container>
        <Card className="shadow-lg border-0 rounded-3" style={{ backgroundColor: 'rgba(255, 255, 255, 1)' }}>
          <Card.Body className="p-4 p-md-5">
            <Row className="align-items-center">
              <Col md={4} className="text-center mb-4 mb-md-0">
                <Image
                  src="/vite.svg" 
                  alt="Property Rental Management System Logo"
                  roundedCircle
                  fluid
                  className="shadow"
                  style={{ maxWidth: '180px' }}
                />
              </Col>
              <Col md={8}>
                <h1 className="display-5 fw-bold mb-3">About Our Property Management System</h1>
                <p className="lead text-dark">
                  A modern Property Management System designed to streamline operations for property owners, managers, and tenants. Our platform simplifies tasks such as rent collection, maintenance tracking, tenant communication, and financial reporting.
                </p>
              </Col>
            </Row>

            <hr className="my-5" />

            <Row>
              <Col md={6}>
                <h4 className="mb-3">Key Information</h4>
                <ListGroup variant="flush">
                  <ListGroup.Item className="px-0">
                    <strong>Key Features:</strong> Lease Management, Online Payments, Maintenance Requests, Tenant Portal, Reporting Dashboard
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0">
                    <strong>Target Users:</strong> Property Owners, Real Estate Managers, Tenants
                  </ListGroup.Item>
                  <ListGroup.Item className="px-0">
                    <strong>Technology Stack:</strong> React, Node.js, Express, MongoDB, Bootstrap
                  </ListGroup.Item>
                </ListGroup>
              </Col>
              <Col md={6} className="mt-4 mt-md-0">
                <h4 className="mb-3">Our Mission</h4>
                <p>To make property management efficient, transparent, and user-friendly. Whether you're managing a single unit or a large portfolio, Bungie Cord provides the tools you need to stay organized and in control.</p>
                <p>For any questions, please <a href="/contact">Contact Us</a>.</p>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
