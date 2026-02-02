import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-light py-3 mt-auto">
      <Container className="text-center text-muted">
        <p className="mb-0">&copy; {new Date().getFullYear()} Daily Work Log System</p>
      </Container>
    </footer>
  );
};

export default Footer;
