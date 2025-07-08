import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Table, Alert, Badge } from 'react-bootstrap';
import { faEdit, faTrash, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { jsPDF } from 'jspdf';

const RAForm = () => {
  // State declarations
  const [Q, setQ] = useState([]);
  const [E, setE] = useState([]);
  const [R0, setR0] = useState({});
  const [T, setT] = useState([]);
  const [U, setU] = useState({});
  const [q0, setQ0] = useState('');
  const [F, setF] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [results, setResults] = useState(null);
  
  // Form inputs
  const [languageDescription, setLanguageDescription] = useState('');
  const [newState, setNewState] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newRegister, setNewRegister] = useState({
    index: '',
    value: ''
  });
  const [transition, setTransition] = useState({
    currentState: '',
    inputSymbol: '',
    registerIndex: '',
    nextStates: []
  });
  const [update, setUpdate] = useState({
    state: '',
    inputSymbol: '',
    registerIndex: ''
  });
  const [testCaseInput, setTestCaseInput] = useState('');
  
  // UI state
  const [errors, setErrors] = useState({
    testCase: '',
    general: ''
  });
  const [editing, setEditing] = useState({
    state: null,
    symbol: null,
    register: null,
    transition: null,
    update: null,
    testCase: null
  });
  const [showTestCases, setShowTestCases] = useState(false);

  // Validate if a value is a positive integer
  const isPositiveInteger = (value) => {
    if (value === '') return false;
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
  };

  // Validate test cases whenever alphabet or test cases change
  useEffect(() => {
    validateTestCases();
  }, [E, testCases]);

  // Add/edit state
  const handleState = () => {
    if (!newState) return;

    if (editing.state !== null) {
      // Update existing state
      const updatedQ = [...Q];
      updatedQ[editing.state] = newState;
      
      // Update transitions, updates, initial state, and accepting states
      const updatedT = T.map(t => [
        t[0] === Q[editing.state] ? newState : t[0],
        t[1],
        t[2],
        new Set(Array.from(t[3]).map(s => s === Q[editing.state] ? newState : s))
      ]);
      
      const updatedU = Object.entries(U).reduce((acc, [key, val]) => {
        const [state, symbol] = JSON.parse(key);
        acc[JSON.stringify([state === Q[editing.state] ? newState : state, symbol])] = val;
        return acc;
      }, {});
      
      const updatedQ0 = q0 === Q[editing.state] ? newState : q0;
      const updatedF = F.map(s => s === Q[editing.state] ? newState : s);
      
      setQ(updatedQ);
      setT(updatedT);
      setU(updatedU);
      setQ0(updatedQ0);
      setF(updatedF);
      setEditing({...editing, state: null});
    } else {
      // Add new state - prevent duplicates
      if (!Q.includes(newState)) {
        setQ([...Q, newState]);
      } else {
        setErrors({...errors, general: `State ${newState} already exists`});
        return;
      }
    }
    setNewState('');
    setErrors({...errors, general: ''});
  };

  // Add/edit symbol
  const handleSymbol = () => {
    if (!newSymbol) return;

    if (editing.symbol !== null) {
      // Update existing symbol
      const updatedE = [...E];
      updatedE[editing.symbol] = newSymbol;
      
      // Update transitions and updates
      const updatedT = T.map(t => [
        t[0],
        t[1] === E[editing.symbol] ? newSymbol : t[1],
        t[2],
        t[3]
      ]);
      
      const updatedU = Object.entries(U).reduce((acc, [key, val]) => {
        const [state, symbol] = JSON.parse(key);
        acc[JSON.stringify([state, symbol === E[editing.symbol] ? newSymbol : symbol])] = val;
        return acc;
      }, {});
      
      setE(updatedE);
      setT(updatedT);
      setU(updatedU);
      setEditing({...editing, symbol: null});
    } else {
      // Add new symbol - prevent duplicates
      if (!E.includes(newSymbol)) {
        setE([...E, newSymbol]);
      } else {
        setErrors({...errors, general: `Symbol ${newSymbol} already exists`});
        return;
      }
    }
    setNewSymbol('');
    setErrors({...errors, general: ''});
  };

  // Add/edit register with positive integer validation
  const handleRegister = () => {
    if (!newRegister.index) return;

    // Validate register value if provided
    if (newRegister.value !== '' && !isPositiveInteger(newRegister.value)) {
      setErrors({...errors, general: 'Register value must be a positive integer'});
      return;
    }

    if (editing.register !== null) {
      // Update existing register
      const registerKey = Object.keys(R0)[editing.register];
      const updatedR0 = {...R0};
      
      // If index changed, update transitions and updates
      if (registerKey !== newRegister.index) {
        delete updatedR0[registerKey];
        
        const updatedT = T.map(t => [
          t[0],
          t[1],
          t[2] === registerKey ? newRegister.index : t[2],
          t[3]
        ]);
        
        const updatedU = Object.entries(U).reduce((acc, [key, val]) => {
          acc[key] = val === registerKey ? newRegister.index : val;
          return acc;
        }, {});
        
        setT(updatedT);
        setU(updatedU);
      }
      
      updatedR0[newRegister.index] = newRegister.value === '' ? null : newRegister.value;
      setR0(updatedR0);
      setEditing({...editing, register: null});
    } else {
      // Add new register - prevent duplicates
      if (!R0.hasOwnProperty(newRegister.index)) {
        setR0({
          ...R0,
          [newRegister.index]: newRegister.value === '' ? null : newRegister.value
        });
      } else {
        setErrors({...errors, general: `Register ${newRegister.index} already exists`});
        return;
      }
    }
    setNewRegister({ index: '', value: '' });
    setErrors({...errors, general: ''});
  };

  // Add/edit transition
  const handleTransition = () => {
  if (!transition.currentState || !transition.inputSymbol || !transition.registerIndex || transition.nextStates.length === 0) {
    setErrors({...errors, general: 'Please fill all transition fields'});
    return;
  }

  // Create the new transition tuple
  const newTransition = [
    transition.currentState,
    transition.inputSymbol,
    transition.registerIndex,
    new Set(transition.nextStates)
  ];

  if (editing.transition !== null) {
    // Editing an existing transition - replace it
    const updatedT = T.map((t, i) => 
      i === editing.transition ? newTransition : t
    );
    setT(updatedT);
    setEditing({...editing, transition: null});
  } else {
    // Adding a new transition - check for existing similar transition
    const existingIndex = T.findIndex(t => 
      t[0] === transition.currentState && 
      t[1] === transition.inputSymbol &&
      t[2] === transition.registerIndex
    );

    if (existingIndex >= 0) {
      // Merge with existing transition
      const existingTransition = T[existingIndex];
      const mergedNextStates = new Set([
        ...Array.from(existingTransition[3]),
        ...transition.nextStates
      ]);
      
      const updatedT = [...T];
      updatedT[existingIndex] = [
        transition.currentState,
        transition.inputSymbol,
        transition.registerIndex,
        mergedNextStates
      ];
      setT(updatedT);
    } else {
      // Add completely new transition
      setT([...T, newTransition]);
    }
  }

  // Reset form
  setTransition({
    currentState: '',
    inputSymbol: '',
    registerIndex: '',
    nextStates: []
  });
  setErrors({...errors, general: ''});
};

  // Add/edit update function
  const handleUpdate = () => {
    if (!update.state || !update.inputSymbol || !update.registerIndex) {
      setErrors({...errors, general: 'Please fill all update function fields'});
      return;
    }

    const key = JSON.stringify([update.state, update.inputSymbol]);
    
    // Check for duplicate update function
    if (U.hasOwnProperty(key) && editing.update === null) {
      setErrors({...errors, general: `Update function for state ${update.state} and symbol ${update.inputSymbol} already exists`});
      return;
    }

    if (editing.update !== null) {
      // Update existing update function
      const originalKey = Object.keys(U)[editing.update];
      const updatedU = {...U};
      
      if (key !== originalKey) {
        delete updatedU[originalKey];
      }
      
      updatedU[key] = update.registerIndex;
      setU(updatedU);
      setEditing({...editing, update: null});
    } else {
      // Add new update function
      setU({
        ...U,
        [key]: update.registerIndex
      });
    }
    
    setUpdate({
      state: '',
      inputSymbol: '',
      registerIndex: ''
    });
    setErrors({...errors, general: ''});
  };

  // Parse test case input in format (a,1),(b,2)
  const parseTestCaseInput = (input) => {
  try {
    // Remove all whitespace and normalize input
    const cleanedInput = input.replace(/\s/g, '');
    
    // Early check for basic structure
    if (!cleanedInput.startsWith('(') || !cleanedInput.endsWith(')')) {
      return { success: false, error: 'Input must start with ( and end with )' };
    }

    // Split into pairs while handling nested parentheses (though we shouldn't have any)
    const pairs = cleanedInput.split(/\),\(/);
    
    // Process each pair
    const result = [];
    for (let i = 0; i < pairs.length; i++) {
      let pair = pairs[i];
      
      // Remove surrounding parentheses for first and last elements
      if (i === 0) pair = pair.substring(1);
      if (i === pairs.length - 1) pair = pair.substring(0, pair.length - 1);
      
      // Split into symbol and value
      const commaPos = pair.indexOf(',');
      if (commaPos === -1) {
        return { success: false, error: `Missing comma in pair: ${pair}` };
      }
      
      const symbol = pair.substring(0, commaPos);
      const valueStr = pair.substring(commaPos + 1);
      
      // Validate symbol
      if (!symbol || !E.includes(symbol)) {
        return { success: false, error: `Symbol '${symbol}' is not in alphabet` };
      }
      
      // Validate value
      let value;
      if (valueStr === '⊥') {
        value = null;
      } else {
        if (!/^\d+$/.test(valueStr)) {
          return { success: false, error: `Value '${valueStr}' must be positive integer or ⊥` };
        }
        value = parseInt(valueStr, 10);
        if (value <= 0) {
          return { success: false, error: `Value ${value} must be positive` };
        }
      }
      
      result.push([symbol, value]);
    }
    
    return { success: true, steps: result };
  } catch (error) {
    return { 
      success: false, 
      error: 'Invalid format. Use (symbol,value),(symbol,value) where value is positive integer or ⊥'
    };
  }
};

  // Add/edit complete test case
  const handleTestCase = () => {
    if (!testCaseInput) {
      setErrors({...errors, testCase: 'Please enter a test case'});
      return;
    }

    const parsed = parseTestCaseInput(testCaseInput);
    if (!parsed.success) {
      setErrors({...errors, testCase: parsed.error});
      return;
    }

    if (editing.testCase !== null) {
      // Update existing test case
      const updatedTestCases = [...testCases];
      updatedTestCases[editing.testCase] = parsed.steps;
      setTestCases(updatedTestCases);
      setEditing({...editing, testCase: null});
    } else {
      // Add new test case
      setTestCases([...testCases, parsed.steps]);
    }
    
    setTestCaseInput('');
    setErrors({...errors, testCase: ''});
  };

  // Validate all test cases
  const validateTestCases = () => {
    if (E.length === 0 || testCases.length === 0) return;

    const invalidCases = testCases.map(testCase => {
      const invalidSymbols = testCase.filter(step => !E.includes(step[0]));
      const invalidValues = testCase.filter(step => 
        step[1] !== null && !isPositiveInteger(step[1])
      );
      
      return {
        testCase,
        invalidSymbols,
        invalidValues,
        isValid: invalidSymbols.length === 0 && invalidValues.length === 0
      };
    });

    const hasInvalidCases = invalidCases.some(c => !c.isValid);
    
    if (hasInvalidCases) {
      const errorMessages = invalidCases
        .filter(c => !c.isValid)
        .map(c => {
          const symbolErrors = c.invalidSymbols.length > 0 ? 
            `Invalid symbols: ${c.invalidSymbols.map(s => s[0]).join(', ')}` : '';
          const valueErrors = c.invalidValues.length > 0 ? 
            `Invalid values: ${c.invalidValues.map(s => s[1]).join(', ')}` : '';
          return `Test case [${c.testCase.map(s => `${s[0]},${s[1] === null ? '⊥' : s[1]}`).join(';')}] - ${[symbolErrors, valueErrors].filter(Boolean).join('; ')}`;
        })
        .join('; ');
      
      setErrors({...errors, testCase: errorMessages});
    } else {
      setErrors({...errors, testCase: ''});
    }
  };

  // Delete items
  const deleteItem = (type, index) => {
    switch (type) {
      case 'state':
        // Prevent deletion if state is in use
        const isStateUsed = 
          q0 === Q[index] || 
          F.includes(Q[index]) || 
          T.some(t => t[0] === Q[index] || Array.from(t[3]).includes(Q[index])) ||
          Object.keys(U).some(key => JSON.parse(key)[0] === Q[index]);
        
        if (isStateUsed) {
          setErrors({...errors, general: `Cannot delete state ${Q[index]} as it's being used`});
          return;
        }
        
        setQ(Q.filter((_, i) => i !== index));
        break;
      
      case 'symbol':
        // Prevent deletion if symbol is in use
        const isSymbolUsed = 
          T.some(t => t[1] === E[index]) ||
          Object.keys(U).some(key => JSON.parse(key)[1] === E[index]);
        
        if (isSymbolUsed) {
          setErrors({...errors, general: `Cannot delete symbol ${E[index]} as it's being used`});
          return;
        }
        
        setE(E.filter((_, i) => i !== index));
        break;
      
      case 'register':
        const registerKey = Object.keys(R0)[index];
        // Prevent deletion if register is in use
        const isRegisterUsed = 
          T.some(t => t[2] === registerKey) ||
          Object.values(U).some(val => val === registerKey);
        
        if (isRegisterUsed) {
          setErrors({...errors, general: `Cannot delete register ${registerKey} as it's being used`});
          return;
        }
        
        const updatedR0 = {...R0};
        delete updatedR0[registerKey];
        setR0(updatedR0);
        break;
      
      case 'transition':
        setT(T.filter((_, i) => i !== index));
        break;
      
      case 'update':
        const updateKey = Object.keys(U)[index];
        const updatedU = {...U};
        delete updatedU[updateKey];
        setU(updatedU);
        break;
      
      case 'testCase':
        setTestCases(testCases.filter((_, i) => i !== index));
        break;
      
      default:
        break;
    }
    setErrors({...errors, general: ''});
  };

  // Start editing an item
  const startEditing = (type, index) => {
    setEditing({...editing, [type]: index});
    
    switch (type) {
      case 'state':
        setNewState(Q[index]);
        break;
      
      case 'symbol':
        setNewSymbol(E[index]);
        break;
      
      case 'register':
        const registerKey = Object.keys(R0)[index];
        setNewRegister({
          index: registerKey,
          value: R0[registerKey] === null ? '' : R0[registerKey]
        });
        break;
      
      case 'transition':
        const t = T[index];
        setTransition({
          currentState: t[0],
          inputSymbol: t[1],
          registerIndex: t[2],
          nextStates: Array.from(t[3]) // Convert Set to array for editing
        });
        break;
      
      case 'update':
        const updateKey = Object.keys(U)[index];
        const [state, symbol] = JSON.parse(updateKey);
        setUpdate({
          state,
          inputSymbol: symbol,
          registerIndex: U[updateKey]
        });
        break;
      
      case 'testCase':
        const testCase = testCases[index];
        setTestCaseInput(testCase.map(step => `(${step[0]},${step[1] === null ? '⊥' : step[1]})`).join(','));
        break;
      
      default:
        break;
    }
  };

  // Cancel editing
  const cancelEditing = (type) => {
    setEditing({...editing, [type]: null});
    
    switch (type) {
      case 'state':
        setNewState('');
        break;
      
      case 'symbol':
        setNewSymbol('');
        break;
      
      case 'register':
        setNewRegister({ index: '', value: '' });
        break;
      
      case 'transition':
        setTransition({
          currentState: '',
          inputSymbol: '',
          registerIndex: '',
          nextStates: []
        });
        break;
      
      case 'update':
        setUpdate({
          state: '',
          inputSymbol: '',
          registerIndex: ''
        });
        break;
      
      case 'testCase':
        setTestCaseInput('');
        break;
      
      default:
        break;
    }
  };

  const clearForm = () => {
    setQ([]);
    setE([]);
    setR0({});
    setT([]);
    setU({});
    setQ0('');
    setF([]);
    setTestCases([]);
    setResults(null);
    setNewState('');
    setNewSymbol('');
    setNewRegister({
      index: '',
      value: ''
    });
    setTransition({
      currentState: '',
      inputSymbol: '',
      registerIndex: '',
      nextStates: []
    });
    setUpdate({
      state: '',
      inputSymbol: '',
      registerIndex: ''
    });
    setTestCaseInput('');
    setErrors({ testCase: '', general: '' });
    setEditing({
      state: null,
      symbol: null,
      register: null,
      transition: null,
      update: null,
      testCase: null
    });
    setShowTestCases(false);
  };

   const generateStructuredPDF = () => {
    const pdf = new jsPDF();
    let y = 20; // Vertical position tracker
    
    // PDF Styles
    const titleStyle = { fontSize: 16, fontStyle: 'bold' };
    const sectionStyle = { fontSize: 14, fontStyle: 'bold' };
    const textStyle = { fontSize: 12 };
    
    // Add Language Description
    if (languageDescription) {
      pdf.setFontSize(titleStyle.fontSize);
      pdf.setFont(undefined, titleStyle.fontStyle);
      pdf.text('Language Description', 105, y, { align: 'center' });
      y += 10;
      
      pdf.setFontSize(textStyle.fontSize);
      pdf.setFont(undefined, 'normal');
      const splitDesc = pdf.splitTextToSize(languageDescription, 180);
      pdf.text(splitDesc, 15, y + 10);
      y += 10 + (splitDesc.length * 7);
    }
    
    // Add Configuration Section
    pdf.setFontSize(sectionStyle.fontSize);
    pdf.setFont(undefined, sectionStyle.fontStyle);
    pdf.text('RA Configuration', 15, y + 20);
    y += 30;
    
    pdf.setFontSize(textStyle.fontSize);
    pdf.setFont(undefined, 'normal');
    
    // States
    pdf.text(`• States (Q): ${Q.join(', ')}`, 20, y);
    y += 10;
    pdf.text(`• Initial State (q0): ${q0}`, 20, y);
    y += 10;
    pdf.text(`• Accepting States (F): ${F.join(', ')}`, 20, y);
    y += 10;
        
    // Alphabet
    pdf.text(`• Alphabet (E): ${E.join(', ')}`, 20, y);
    y += 10;

    // Registers
    pdf.text('• Initial Registers Values (R0):', 20, y);
    y += 10;

    pdf.text('Register Index : Value', 25, y);
    y += 10;
    
    Object.entries(R0).forEach(([index, value]) => {
      // const registerText = `${index}: ${value === null ? '⊥' : value}`;
      const registerText = `${index}: ${value === null ? '4444' : value}`;
      // Check if we need a new page
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }
      
      pdf.text(registerText, 25, y);
      y += 10;
    });

    // Check if we need a new page
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }

    // Update Function
    pdf.text('• Update Function (U):', 20, y);
    y += 10;

    pdf.text('( Current State, Symbol ) : Register Index', 25, y);
    y += 10;
    
    Object.entries(U).forEach(([key, value]) => {
      const [state, symbol] = JSON.parse(key);
      const updateText = `( ${state}, ${symbol} ) : ${value}`;
      
      // Check if we need a new page
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }
      
      pdf.text(updateText, 25, y);
      y += 10;
    });
    
    // Transitions (with formatted header)
    pdf.text('• Transitions (T): ', 20, y);
    y += 10;
  
    pdf.text('(Current State, Symbol, Register Index) --> Next States', 25, y);
    y += 10;
    
    T.forEach((t, i) => {
      const transitionText = `${i+1}. ( ${t[0]} ,${t[1]}, ${t[2]} ) --> ${Array.from(t[3]).join(', ')}`;
      
      // Check if we need a new page
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }
      
      pdf.text(transitionText, 25, y);
      y += 10;
    });
    
    // Test Cases and Results (merged section)
    if (testCases.length > 0) {
      y += 10;
      pdf.setFontSize(sectionStyle.fontSize);
      pdf.setFont(undefined, sectionStyle.fontStyle);
      pdf.text('Test Cases & Results', 15, y);
      y += 15;
      
      pdf.setFontSize(textStyle.fontSize);
      pdf.setFont(undefined, 'normal');
      
      testCases.forEach((testCase, i) => {
        const testCaseText = `Test ${i+1}: ${testCase.map(step => `(${step[0]},${step[1]})`).join(', ')}`;
        const resultText = results 
          ? `Result: ${results.results[i]?.accepted ? 'Accepted' : 'Rejected'}`
          : 'Not tested yet';
        
        // Check if we need a new page
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.text(testCaseText, 20, y);
        y += 10;
        pdf.text(resultText, 25, y);
        y += 15;
      });
    }
    
    // Save the PDF
    pdf.save(`RA_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // Test the automaton with validation
  const testAutomaton = async () => {
    // Check for invalid register values
    const invalidRegister = Object.entries(R0).find(([_, value]) => 
      value !== null && !isPositiveInteger(value)
    );
    
    if (invalidRegister) {
      setErrors({...errors, general: `Register ${invalidRegister[0]} has invalid value (must be positive integer)`});
      return;
    }

    // Check for invalid test cases
    if (errors.testCase) {
      setErrors({...errors, general: 'Please fix all invalid test cases before testing'});
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/process-automata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          automata_type: 'RA',
          config: {
            Q: Array.from(Q),
            E: Array.from(E),
            T: T.map(t => [t[0], t[1], t[2], Array.from(t[3])]),
            R0: {...R0},
            U: Object.entries(U).map(([key, val]) => {
              const [state, symbol] = JSON.parse(key);
              return [state, symbol, val];  // Returns as [state, symbol, register]
            }),
            q0: q0,
            F: Array.from(F)
          },
          test_cases: testCases
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        success: false,
        error: 'Failed to connect to the server'
      });
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Register Automaton (RA) Configuration</h2>
      
      {errors.general && <Alert variant="danger">{errors.general}</Alert>}

      <Card className="mb-4">
        <Card.Header>Language Description</Card.Header>
        <Card.Body>
          <Form.Control
            as="textarea"
            rows={3}
            value={languageDescription}
            onChange={(e) => setLanguageDescription(e.target.value)}
            placeholder="Enter a description of the language this RA recognizes"
          />
        </Card.Body>
      </Card>
      
      <Row>
        {/* States Section */}
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header>States (Q)</Card.Header>
            <Card.Body>
              <Form.Group>
                <Form.Label>
                  {editing.state !== null ? `Editing State ${Q[editing.state]}` : 'Add State'}
                </Form.Label>
                <div className="d-flex">
                  <Form.Control
                    type="text"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    placeholder="e.g. q0"
                  />
                  <Button 
                    variant={editing.state !== null ? "success" : "primary"} 
                    onClick={handleState} 
                    className="ms-2"
                    disabled={!newState}
                  >
                    {editing.state !== null ? 'Update' : 'Add'}
                  </Button>
                  {editing.state !== null && (
                    <Button 
                      variant="secondary" 
                      onClick={() => cancelEditing('state')} 
                      className="ms-2"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </Form.Group>
              
              {Q.length > 0 && (
                <div className="mt-3">
                  <h6>Current States:</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>State</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Q.map((state, index) => (
                        <tr key={index}>
                          <td>
                            {state}
                            {q0 === state && <Badge bg="info" className="ms-2">Initial</Badge>}
                            {F.includes(state) && <Badge bg="success" className="ms-2">Accepting</Badge>}
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => startEditing('state', index)}
                              className="me-2"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => deleteItem('state', index)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Alphabet Section */}
          <Card className="mb-4">
            <Card.Header>Alphabet (Σ)</Card.Header>
            <Card.Body>
              <Form.Group>
                <Form.Label>
                  {editing.symbol !== null ? `Editing Symbol ${E[editing.symbol]}` : 'Add Symbol'}
                </Form.Label>
                <div className="d-flex">
                  <Form.Control
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    placeholder="e.g. a"
                    maxLength="1"
                  />
                  <Button 
                    variant={editing.symbol !== null ? "success" : "primary"} 
                    onClick={handleSymbol} 
                    className="ms-2"
                    disabled={!newSymbol}
                  >
                    {editing.symbol !== null ? 'Update' : 'Add'}
                  </Button>
                  {editing.symbol !== null && (
                    <Button 
                      variant="secondary" 
                      onClick={() => cancelEditing('symbol')} 
                      className="ms-2"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </Form.Group>
              
              {E.length > 0 && (
                <div className="mt-3">
                  <h6>Current Alphabet:</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {E.map((symbol, index) => (
                        <tr key={index}>
                          <td>{symbol}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => startEditing('symbol', index)}
                              className="me-2"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => deleteItem('symbol', index)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Registers and Transitions Section */}
        <Col md={4}>
          {/* Initial Register Values Section */}
          <Card className="mb-4">
            <Card.Header>Initial Register Values (τ₀)</Card.Header>
            <Card.Body>
              <Form.Group>
                <Form.Label>
                  {editing.register !== null ? `Editing Register ${Object.keys(R0)[editing.register]}` : 'Add Register'}
                </Form.Label>
                <div className="d-flex mb-2">
                  <Form.Control
                    type="text"
                    value={newRegister.index}
                    onChange={(e) => setNewRegister({...newRegister, index: e.target.value})}
                    placeholder="Register index (e.g. 1)"
                  />
                </div>
                <div className="d-flex">
                  <Form.Control
                    type="number"
                    min="1"
                    step="1"
                    value={newRegister.value}
                    onChange={(e) => setNewRegister({...newRegister, value: e.target.value})}
                    placeholder="Positive integer (leave empty for ⊥)"
                    isInvalid={newRegister.value !== '' && !isPositiveInteger(newRegister.value)}
                  />
                  <Button 
                    variant={editing.register !== null ? "success" : "primary"} 
                    onClick={handleRegister} 
                    className="ms-2"
                    disabled={!newRegister.index || (newRegister.value !== '' && !isPositiveInteger(newRegister.value))}
                  >
                    {editing.register !== null ? 'Update' : 'Add'}
                  </Button>
                  {editing.register !== null && (
                    <Button 
                      variant="secondary" 
                      onClick={() => cancelEditing('register')} 
                      className="ms-2"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                {newRegister.value !== '' && !isPositiveInteger(newRegister.value) && (
                  <Form.Text className="text-danger">
                    Please enter a positive integer or leave empty for ⊥
                  </Form.Text>
                )}
              </Form.Group>
              
              {Object.keys(R0).length > 0 && (
                <div className="mt-3">
                  <h6>Current Registers:</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>Index</th>
                        <th>Initial Value</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(R0).map(([index, value], i) => (
                        <tr key={index}>
                          <td>{index}</td>
                          <td>{value === null ? '⊥' : value}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => startEditing('register', i)}
                              className="me-2"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => deleteItem('register', i)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Transitions Section */}
          <Card className="mb-4">
            <Card.Header>Transitions (δ)</Card.Header>
            <Card.Body>
              <Form.Group>
                <Form.Label>Current State</Form.Label>
                <Form.Select
                  value={transition.currentState}
                  onChange={(e) => setTransition({...transition, currentState: e.target.value})}
                >
                  <option value="">Select state</option>
                  {Q.map((state, index) => (
                    <option key={index} value={state}>{state}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Input Symbol</Form.Label>
                <Form.Select
                  value={transition.inputSymbol}
                  onChange={(e) => setTransition({...transition, inputSymbol: e.target.value})}
                >
                  <option value="">Select symbol</option>
                  {E.map((symbol, index) => (
                    <option key={index} value={symbol}>{symbol}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Register Index</Form.Label>
                <Form.Select
                  value={transition.registerIndex}
                  onChange={(e) => setTransition({...transition, registerIndex: e.target.value})}
                >
                  <option value="">Select register</option>
                  {Object.keys(R0).map((index, i) => (
                    <option key={i} value={index}>{index}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Next States</Form.Label>
                <div>
                  {Q.map((state, index) => (
                    <Form.Check
                      key={index}
                      type="checkbox"
                      label={state}
                      checked={transition.nextStates.includes(state)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTransition({
                            ...transition,
                            nextStates: [...transition.nextStates, state]
                          });
                        } else {
                          setTransition({
                            ...transition,
                            nextStates: transition.nextStates.filter(s => s !== state)
                          });
                        }
                      }}
                    />
                  ))}
                </div>
              </Form.Group>

              <div className="d-flex mt-3">
                <Button 
                  variant={editing.transition !== null ? "success" : "primary"} 
                  onClick={handleTransition}
                  disabled={!transition.currentState || !transition.inputSymbol || !transition.registerIndex || transition.nextStates.length === 0}
                >
                  {editing.transition !== null ? 'Update Transition' : 'Add Transition'}
                </Button>
                {editing.transition !== null && (
                  <Button 
                    variant="secondary" 
                    onClick={() => cancelEditing('transition')} 
                    className="ms-2"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              {T.length > 0 && (
  <div className="mt-3">
    <h6>Current Transitions:</h6>
    <Table striped bordered size="sm">
      <thead>
        <tr>
          <th>Current State</th>
          <th>Input Symbol</th>
          <th>Register</th>
          <th>Next States</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {T.map((t, index) => (
          <tr key={index}>
            <td>{t[0]}</td>
            <td>{t[1]}</td>
            <td>{t[2]}</td>
            <td>{Array.from(t[3]).join(', ')}</td>
            <td>
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={() => startEditing('transition', index)}
                className="me-2"
              >
                <FontAwesomeIcon icon={faEdit} />
              </Button>
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={() => deleteItem('transition', index)}
              >
                <FontAwesomeIcon icon={faTrash} />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  </div>
)}
            </Card.Body>
          </Card>
        </Col>

        {/* Update Function, Initial/Accepting States Section */}
        <Col md={4}>
          {/* Update Function Section */}
          <Card className="mb-4">
            <Card.Header>Update Function (U)</Card.Header>
            <Card.Body>
              <Form.Group>
                <Form.Label>State</Form.Label>
                <Form.Select
                  value={update.state}
                  onChange={(e) => setUpdate({...update, state: e.target.value})}
                >
                  <option value="">Select state</option>
                  {Q.map((state, index) => (
                    <option key={index} value={state}>{state}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Input Symbol</Form.Label>
                <Form.Select
                  value={update.inputSymbol}
                  onChange={(e) => setUpdate({...update, inputSymbol: e.target.value})}
                >
                  <option value="">Select symbol</option>
                  {E.map((symbol, index) => (
                    <option key={index} value={symbol}>{symbol}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mt-3">
                <Form.Label>Register to Update</Form.Label>
                <Form.Select
                  value={update.registerIndex}
                  onChange={(e) => setUpdate({...update, registerIndex: e.target.value})}
                >
                  <option value="">Select register</option>
                  {Object.keys(R0).map((index, i) => (
                    <option key={i} value={index}>{index}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              <div className="d-flex mt-3">
                <Button 
                  variant={editing.update !== null ? "success" : "primary"} 
                  onClick={handleUpdate}
                  disabled={!update.state || !update.inputSymbol || !update.registerIndex}
                >
                  {editing.update !== null ? 'Update Function' : 'Add Function'}
                </Button>
                {editing.update !== null && (
                  <Button 
                    variant="secondary" 
                    onClick={() => cancelEditing('update')} 
                    className="ms-2"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              {Object.keys(U).length > 0 && (
                <div className="mt-3">
                  <h6>Current Update Functions:</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>State</th>
                        <th>Input Symbol</th>
                        <th>Register to Update</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(U).map(([key, val], index) => {
                        const [state, symbol] = JSON.parse(key);
                        return (
                          <tr key={index}>
                            <td>{state}</td>
                            <td>{symbol}</td>
                            <td>{val}</td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                onClick={() => startEditing('update', index)}
                                className="me-2"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => deleteItem('update', index)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Initial State Section */}
          <Card className="mb-4">
            <Card.Header>Initial State (q0)</Card.Header>
            <Card.Body>
              <Form.Select
                value={q0}
                onChange={(e) => setQ0(e.target.value)}
              >
                <option value="">Select initial state</option>
                {Q.map((state, index) => (
                  <option key={index} value={state}>{state}</option>
                ))}
              </Form.Select>
            </Card.Body>
          </Card>

          {/* Accepting States Section */}
          <Card className="mb-4">
            <Card.Header>Accepting States (F)</Card.Header>
            <Card.Body>
              <Form.Group>
                {Q.map((state, index) => (
                  <Form.Check
                    key={index}
                    type="checkbox"
                    label={state}
                    checked={F.includes(state)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setF([...F, state]);
                      } else {
                        setF(F.filter(s => s !== state));
                      }
                    }}
                  />
                ))}
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="text-center mb-4">
        <Button 
          variant="primary" 
          size="lg"
          onClick={() => setShowTestCases(!showTestCases)}
          disabled={
            Q.length === 0 || 
            E.length === 0 || 
            Object.keys(R0).length === 0 ||
            T.length === 0 || 
            Object.keys(U).length === 0 ||
            !q0 || 
            F.length === 0
          }
          className="me-3"
        >
          {showTestCases ? 'Hide Test Cases' : 'Show Test Cases'}
        </Button>
        <Button 
          variant="danger" 
          size="lg"
          onClick={clearForm}
        >
          Clear Form
        </Button>
      </div>

      {showTestCases && (
        <Card className="mb-4">
          <Card.Header>Test Cases</Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Label>
                {editing.testCase !== null ? `Editing Test Case ${editing.testCase + 1}` : 'Add Test Case'}
              </Form.Label>
              
              <Form.Group className="mb-3">
                <Form.Label>Enter test case in format (symbol,value),(symbol,value)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={testCaseInput}
                  onChange={(e) => setTestCaseInput(e.target.value)}
                  placeholder="e.g. (a,187),(b,228),(a,848) "
                  isInvalid={!!errors.testCase}
                />
                <Form.Text>
                  Example: (a,187),(b,228),(a,848) 
                </Form.Text>
                {errors.testCase && (
                  <Form.Text className="text-danger">
                    {errors.testCase}
                  </Form.Text>
                )}
              </Form.Group>

              <div className="d-flex">
                <Button 
                  variant={editing.testCase !== null ? "success" : "primary"} 
                  onClick={handleTestCase} 
                  disabled={!testCaseInput}
                >
                  {editing.testCase !== null ? 'Update Test Case' : 'Add Test Case'}
                </Button>
                {editing.testCase !== null && (
                  <Button 
                    variant="secondary" 
                    onClick={() => cancelEditing('testCase')} 
                    className="ms-2"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </Form.Group>
            
            {testCases.length > 0 && (
              <div className="mt-3">
                <h6>Current Test Cases:</h6>
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Steps</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testCases.map((testCase, index) => {
                      const invalidSymbols = testCase.filter(step => !E.includes(step[0]));
                      const invalidValues = testCase.filter(step => 
                        step[1] !== null && !isPositiveInteger(step[1])
                      );
                      const isValid = invalidSymbols.length === 0 && invalidValues.length === 0;
                      
                      return (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            {testCase.map((step, i) => (
                              <div key={i}>
                                ({step[0]}, {step[1] === null ? '⊥' : step[1]}){i < testCase.length - 1 ? ', ' : ''}
                              </div>
                            ))}
                          </td>
                          <td>
                            {isValid ? (
                              <span className="text-success">
                                <FontAwesomeIcon icon={faCheck} className="me-1" />
                                Valid
                              </span>
                            ) : (
                              <span className="text-danger">
                                <FontAwesomeIcon icon={faTimes} className="me-1" />
                                {invalidSymbols.length > 0 ? 'Invalid symbol' : 'Invalid value'}
                              </span>
                            )}
                          </td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => startEditing('testCase', index)}
                              className="me-2"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => deleteItem('testCase', index)}
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
                
                <div className="text-center mt-3">
                  <Button 
                    variant="success" 
                    size="lg"
                    onClick={testAutomaton}
                    disabled={
                      testCases.length === 0 ||
                      !!errors.testCase
                    }
                  >
                    Test Automaton
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {results && (
        <Card className="mb-4">
          <Card.Header>Test Results</Card.Header>
          <Card.Body>
            {results.success ? (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Test Case</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((result, index) => (
                    <tr key={index}>
                      <td>
                        {result.input.map((step, i) => (
                          <div key={i}>({step[0]}, {step[1] === null ? '⊥' : step[1]}){i < result.input.length - 1 ? ', ' : ''}</div>
                        ))}
                      </td>
                      <td>
                        {result.accepted ? (
                          <Badge bg="success">Accepted</Badge>
                        ) : (
                          <Badge bg="danger">Rejected</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <Alert variant="danger">{results.error}</Alert>
            )}
          </Card.Body>
        </Card>
      )}
      <Button 
        variant="info" 
        size="lg"
        onClick={generateStructuredPDF}
        disabled={Q.length === 0}
        className="me-3"
      >
        Export PDF
      </Button>
    </div>
  );
};

export default RAForm;