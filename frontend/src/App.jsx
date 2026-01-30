import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Chatbot from './pages/Chatbot';
import Judgments from './pages/Judgments';
import Contracts from './pages/Contracts';
import Search from './pages/Search';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" />;
};

const MainLayout = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return children;
  }
  
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/chatbot" 
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Chatbot />
                  </MainLayout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/judgments" 
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Judgments />
                  </MainLayout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/contracts" 
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Contracts />
                  </MainLayout>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/search" 
              element={
                <PrivateRoute>
                  <MainLayout>
                    <Search />
                  </MainLayout>
                </PrivateRoute>
              } 
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
