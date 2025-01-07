import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/main-layout';
import Home from './pages/home';
import Create from './pages/create';
import Explore from './pages/explore';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/explore" element={<Explore />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;