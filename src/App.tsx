// src/App.tsx
import React, { useEffect } from 'react';
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
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/profile', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          console.log('User is logged in:', userData);
        } else {
          console.log('User is not logged in');
        }
      } catch (error) {
        console.log('Error checking auth status:', error);
      }
    };

    checkAuthStatus();
  }, []);

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