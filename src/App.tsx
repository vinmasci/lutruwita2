// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MainLayout from './components/layout/main-layout';
import Home from './pages/home';
import Create from './pages/create';
import Explore from './pages/explore';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1a1a1a',
      paper: '#262626',
    },
    primary: {
      main: '#90caf9',
    },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
      <Routes>
  <Route element={<MainLayout />}>
    <Route path="/" element={<Home />} />
    <Route path="/create" element={<Create />} />
    <Route path="/explore" element={<Explore />} />
    <Route path="/callback" element={<Explore />} />
    <Route 
  path="/login" 
  element={<Navigate to="http://localhost:3001/api/auth/login" replace />} 
/>
<Route 
  path="/logout" 
  element={<Navigate to="http://localhost:3001/api/auth/logout" replace />} 
/>
  </Route>
</Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;