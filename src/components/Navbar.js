import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { faToolbox } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const CustomNavbar = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <FontAwesomeIcon icon={faToolbox} className="me-2" />
          Toolbox
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/nfa">NFA</Nav.Link>
            <Nav.Link as={Link} to="/ra">RA</Nav.Link>
            <Nav.Link as={Link} to="/safa">SAFA</Nav.Link>
            <Nav.Link as={Link} to="/cca">CCA</Nav.Link>
            <Nav.Link as={Link} to="/cma">CMA</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;