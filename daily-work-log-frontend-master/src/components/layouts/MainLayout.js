import React from 'react';
import { Container } from 'react-bootstrap';
import Header from '../common/Header';
import Footer from '../common/Footer';
import { Outlet } from 'react-router-dom'; // ✅ חשוב!

const MainLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container className="flex-grow-1 mb-4">
        <Outlet /> {/* ✅ זה יציג את כל הנתיבים הפנימיים */}
      </Container>
      <Footer />
    </div>
  );
};

export default MainLayout;
