// import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AutomataForm from './components/AutomataForm';
import Navbar from './components/Navbar';
import NFAForm from './components/NFAForm';
import RAForm from './components/RAForm';
import SAFAForm from './components/SAFAForm';
import CCAForm from './components/CCAForm';
import CMAForm from './components/CMAForm';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<AutomataForm />} />
            <Route path="/nfa" element={<NFAForm />} />
            <Route path="/ra" element={<RAForm />} />
            <Route path="/safa" element={<SAFAForm />} />
            <Route path="/cca" element={<CCAForm />} />
            <Route path="/cma" element={<CMAForm />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;