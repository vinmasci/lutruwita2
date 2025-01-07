import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
          backgroundImage: 'none', // Removes the default gradient
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
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<Create />} />
            <Route path="/explore" element={<Explore />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
