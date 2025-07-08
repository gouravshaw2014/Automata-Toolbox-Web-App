import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Table, Alert, Badge } from 'react-bootstrap';
import { faEdit, faTrash, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { jsPDF } from 'jspdf';

const SAFAForm = () => {
  // SAFA Components
  const [Q, setQ] = useState([]); // States
  const [E, setE] = useState([]); // Alphabet
  const [H, setH] = useState([]); // Set of sets
  const [T, setT] = useState([]); // Transitions
  const [q0, setQ0] = useState(''); // Initial state
  const [F, setF] = useState([]); // Accepting states
  const [testCases, setTestCases] = useState([]); // Test cases
  const [results, setResults] = useState(null); // Test results
  const [emptinessResult, setEmptinessResult] = useState(null); // Emptiness check result

  // Form inputs
  const [languageDescription, setLanguageDescription] = useState('');
  const [newState, setNewState] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newSet, setNewSet] = useState('');
  const [transition, setTransition] = useState({
    currentState: '',
    inputSymbol: '',
    setCheck: { setName: '', checkType: '0' }, // 0=known, 1=new
    nextStates: [] // Array of {state, setInsertion}
  });
  const [testCaseInput, setTestCaseInput] = useState('');
  const [showTestCases, setShowTestCases] = useState(false);

  // UI state
  const [errors, setErrors] = useState({
    testCase: '',
    general: ''
  });
  const [editing, setEditing] = useState({
    state: null,
    symbol: null,
    set: null,
    transition: null,
    testCase: null
  });

  // Validation helpers
  const isPositiveInteger = (value) => {
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
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

      // Split into pairs while handling nested parentheses
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
        if (!isPositiveInteger(valueStr)) {
          return { success: false, error: `Value '${valueStr}' must be positive integer` };
        }
        
        result.push([symbol, parseInt(valueStr, 10)]);
      }
      
      return { success: true, steps: result };
    } catch (error) {
      return { 
        success: false, 
        error: 'Invalid format. Use (symbol,value),(symbol,value) where value is positive integer'
      };
    }
  };

  // State management
  const handleState = () => {
    if (!newState) return;

    if (editing.state !== null) {
      // Update existing state
      const updatedQ = [...Q];
      updatedQ[editing.state] = newState;
      
      // Update all references
      const updatedT = T.map(t => {
        const nextStates = Array.from(t[3]).map(ns => {
          const [state, set] = ns.split(',');
          return `${state === Q[editing.state] ? newState : state},${set}`;
        });
        return [
          t[0] === Q[editing.state] ? newState : t[0],
          t[1],
          t[2],
          new Set(nextStates)
        ];
      });
      
      setQ(updatedQ);
      setT(updatedT);
      setQ0(q0 === Q[editing.state] ? newState : q0);
      setF(F.map(s => s === Q[editing.state] ? newState : s));
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

  // Alphabet management
  const handleSymbol = () => {
    if (!newSymbol) return;

    if (editing.symbol !== null) {
      // Update existing symbol
      const updatedE = [...E];
      updatedE[editing.symbol] = newSymbol;
      
      // Update transitions
      const updatedT = T.map(t => [
        t[0],
        t[1] === E[editing.symbol] ? newSymbol : t[1],
        t[2],
        t[3]
      ]);
      
      setE(updatedE);
      setT(updatedT);
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

  // Set management
  const handleSet = () => {
    if (!newSet) return;

    if (editing.set !== null) {
      // Update existing set
      const updatedH = [...H];
      updatedH[editing.set] = newSet;
      
      // Update transitions
      const updatedT = T.map(t => {
        const [setName, checkType] = t[2].split(',');
        const nextStates = Array.from(t[3]).map(ns => {
          const [state, set] = ns.split(',');
          return `${state},${set === H[editing.set] ? newSet : set}`;
        });
        return [
          t[0],
          t[1],
          `${setName === H[editing.set] ? newSet : setName},${checkType}`,
          new Set(nextStates)
        ];
      });
      
      setH(updatedH);
      setT(updatedT);
      setEditing({...editing, set: null});
    } else {
      // Add new set - prevent duplicates
      if (!H.includes(newSet)) {
        setH([...H, newSet]);
      } else {
        setErrors({...errors, general: `Set ${newSet} already exists`});
        return;
      }
    }
    setNewSet('');
    setErrors({...errors, general: ''});
  };

  // Transition management
  const handleTransition = () => {
  if (!transition.currentState || !transition.inputSymbol || 
      !transition.setCheck.setName || transition.nextStates.length === 0) {
    setErrors({...errors, general: 'Please fill all transition fields'});
    return;
  }

  const transitionStr = `${transition.setCheck.setName},${transition.setCheck.checkType}`;
  const nextStatesSet = new Set(
    transition.nextStates.map(ns => `${ns.state},${ns.setInsertion}`)
  );

  if (editing.transition !== null) {
    // Editing an existing transition - replace it completely
    const updatedT = T.map((t, index) => 
      index === editing.transition
        ? [
            transition.currentState,
            transition.inputSymbol,
            transitionStr,
            nextStatesSet
          ]
        : t
    );
    setT(updatedT);
    setEditing({...editing, transition: null});
  } else {
    // Adding a new transition - check for existing similar transition
    const existingIndex = T.findIndex(t => 
      t[0] === transition.currentState && 
      t[1] === transition.inputSymbol &&
      t[2] === transitionStr
    );

    if (existingIndex >= 0) {
      // Merge with existing transition
      const existingTransition = T[existingIndex];
      const mergedNextStates = new Set([
        ...Array.from(existingTransition[3]),
        ...Array.from(nextStatesSet)
      ]);
      
      const updatedT = [...T];
      updatedT[existingIndex] = [
        transition.currentState,
        transition.inputSymbol,
        transitionStr,
        mergedNextStates
      ];
      setT(updatedT);
    } else {
      // Add completely new transition
      setT([
        ...T,
        [
          transition.currentState,
          transition.inputSymbol,
          transitionStr,
          nextStatesSet
        ]
      ]);
    }
  }

  // Reset form
  setTransition({
    currentState: '',
    inputSymbol: '',
    setCheck: { setName: '', checkType: '0' },
    nextStates: []
  });
  setErrors({...errors, general: ''});
};

  // Test case management
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
      const invalidValues = testCase.filter(step => !isPositiveInteger(step[1]));
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
          return `Test case [${c.testCase.map(s => s.join(':')).join(', ')}] - ${[symbolErrors, valueErrors].filter(Boolean).join('; ')}`;
        })
        .join('; ');
      
      setErrors({...errors, testCase: errorMessages});
    } else {
      setErrors({...errors, testCase: ''});
    }
  };

  // Delete operations
  const deleteItem = (type, index) => {
    switch (type) {
      case 'state':
        // Check if state is in use
        if (q0 === Q[index] || F.includes(Q[index]) || 
            T.some(t => t[0] === Q[index] || Array.from(t[3]).some(ns => ns.startsWith(Q[index])))) {
          setErrors({...errors, general: `Cannot delete state ${Q[index]} as it's being used`});
          return;
        }
        setQ(Q.filter((_, i) => i !== index));
        break;
      
      case 'symbol':
        // Check if symbol is in use
        if (T.some(t => t[1] === E[index])) {
          setErrors({...errors, general: `Cannot delete symbol ${E[index]} as it's being used`});
          return;
        }
        setE(E.filter((_, i) => i !== index));
        break;
      
      case 'set':
        // Check if set is in use
        if (T.some(t => t[2].startsWith(H[index]) || Array.from(t[3]).some(ns => ns.endsWith(H[index])))) {
          setErrors({...errors, general: `Cannot delete set ${H[index]} as it's being used`});
          return;
        }
        setH(H.filter((_, i) => i !== index));
        break;
      
      case 'transition':
        setT(T.filter((_, i) => i !== index));
        break;
      
      case 'testCase':
        setTestCases(testCases.filter((_, i) => i !== index));
        break;
      
      default:
        break;
    }
    setErrors({...errors, general: ''});
  };

  // Edit operations
  const startEditing = (type, index) => {
    setEditing({...editing, [type]: index});
    
    switch (type) {
      case 'state':
        setNewState(Q[index]);
        break;
      
      case 'symbol':
        setNewSymbol(E[index]);
        break;
      
      case 'set':
        setNewSet(H[index]);
        break;
      
      case 'transition':
        const t = T[index];
        const [setName, checkType] = t[2].split(',');
        
        // Convert Set to array of objects for the form
        const nextStates = Array.from(t[3]).map(ns => {
          const [state, setInsertion] = ns.split(',');
          return { state, setInsertion };
        });

        setTransition({
          currentState: t[0],
          inputSymbol: t[1],
          setCheck: { setName, checkType },
          nextStates: nextStates
        });
        break;
      
      case 'testCase':
        setTestCaseInput(testCases[index].map(step => `(${step[0]},${step[1]})`).join(','));
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
      
      case 'set':
        setNewSet('');
        break;
      
      case 'transition':
        setTransition({
          currentState: '',
          inputSymbol: '',
          setCheck: { setName: '', checkType: '0' },
          nextStates: []
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
    setH([]);
    setT([]);
    setQ0('');
    setF([]);
    setTestCases([]);
    setResults(null);
    setEmptinessResult(null);
    setNewState('');
    setNewSymbol('');
    setNewSet('');
    setTransition({
      currentState: '',
      inputSymbol: '',
      setCheck: { setName: '', checkType: '0' },
      nextStates: []
    });
    setTestCaseInput('');
    setErrors({ testCase: '', general: '' });
    setEditing({
      state: null,
      symbol: null,
      set: null,
      transition: null,
      testCase: null
    });
    setShowTestCases(false);
  };

  // Check emptiness of the SAFA language
  const checkEmptiness = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/check-emptiness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          automata_type: 'SAFA',
          config: {
            Q: Array.from(Q),
            E: Array.from(E),
            H: Array.from(H),
            T: T.map(t => [t[0], t[1], t[2], Array.from(t[3])]),
            q0,
            F: Array.from(F)
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setEmptinessResult(data);
    } catch (error) {
      setEmptinessResult({
        success: false,
        error: 'Failed to connect to the server'
      });
    }
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
      pdf.text('SAFA Configuration', 15, y + 20);
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

      // Sets
      pdf.text(`• Sets (H): ${H.join(', ')}`, 20, y);
      y += 10;  
            
      // Transitions (with formatted header)
      pdf.text('• Transitions (T): ', 20, y);
      y += 10;
    
      pdf.text('(Current State, Symbol, Set check) --> (Next States, Insertion)  [\'-\' for no insertion]', 25, y);
      y += 10;
      
      T.forEach((t, i) => {
        const [fromState, symbol, guardRaw, targets] = t;

        // Convert guard h1,1 to !p(h1) and h1,0 to p(h1)
        let set_check = '';
        if (typeof guardRaw === 'string' && guardRaw.includes(',')) {
          const [varName, flag] = guardRaw.split(',');  
          set_check = flag === '1' ? `!p(${varName})` : `p(${varName})`;
        } else {
          set_check = guardRaw; // fallback if it's not in expected format
        }

        // Convert targets like ["q1,-", "q2,h1"] to [(q1,-), (q2,ins(h1))]
        const targetText = Array.from(targets)
          .map(tgt => {
            const [state, op] = tgt.split(',');
            if (op === '-') {
              return `(${state}, -)`;
            } else {
              return `(${state}, ins(${op}))`;
            }
          })
          .join(', ');

        const transitionText = `( ${fromState}, ${symbol}, ${set_check} ) --> ${targetText}`;

        // Check if we need a new page
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }

        pdf.text(transitionText, 25, y);
        y += 10;
      });

      // Emptyness Result
      if (emptinessResult) {
        pdf.setFontSize(sectionStyle.fontSize);
        pdf.setFont(undefined, sectionStyle.fontStyle);
        y += 5;
        
        if (emptinessResult.success) {
          if(emptinessResult.result){
            pdf.text('Emptiness Result : SAFA launguage is empty', 15, y);
          }else{
            pdf.text('Emptiness Result : SAFA launguage is not empty', 15, y);
          }
        } 
        y += 5;
        if (y > 250) {
            pdf.addPage();
            y = 20;
        }
      }
      
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
      pdf.save(`SAFA_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    };

  // Test SAFA
  const testSAFA = async () => {
    // Validate all test cases
    const invalidTestCases = testCases.some(testCase => 
      testCase.some(step => !isPositiveInteger(step[1]))
    );
    
    if (invalidTestCases || errors.testCase) {
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
          automata_type: 'SAFA',
          config: {
            Q: Array.from(Q),
            E: Array.from(E),
            H: Array.from(H),
            T: T.map(t => [t[0], t[1], t[2], Array.from(t[3])]),
            q0,
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

  // Validate test cases when alphabet or test cases change
  useEffect(() => {
    validateTestCases();
  }, [E, testCases]);

  return (
    <div className="container mt-4">
      <h2 className="mb-4">SAFA Configuration</h2>
      
      {errors.general && <Alert variant="danger">{errors.general}</Alert>}

      <Card className="mb-4">
        <Card.Header>Language Description</Card.Header>
        <Card.Body>
          <Form.Control
            as="textarea"
            rows={3}
            value={languageDescription}
            onChange={(e) => setLanguageDescription(e.target.value)}
            placeholder="Enter a description of the language this SAFA recognizes"
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

        {/* Sets and Transitions Section */}
        <Col md={4}>
          {/* Sets Section */}
          <Card className="mb-4">
            <Card.Header>Sets (H)</Card.Header>
            <Card.Body>
              <Form.Group>
                <Form.Label>
                  {editing.set !== null ? `Editing Set ${H[editing.set]}` : 'Add Set'}
                </Form.Label>
                <div className="d-flex">
                  <Form.Control
                    type="text"
                    value={newSet}
                    onChange={(e) => setNewSet(e.target.value)}
                    placeholder="e.g. h1"
                  />
                  <Button 
                    variant={editing.set !== null ? "success" : "primary"} 
                    onClick={handleSet} 
                    className="ms-2"
                    disabled={!newSet}
                  >
                    {editing.set !== null ? 'Update' : 'Add'}
                  </Button>
                  {editing.set !== null && (
                    <Button 
                      variant="secondary" 
                      onClick={() => cancelEditing('set')} 
                      className="ms-2"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </Form.Group>
              
              {H.length > 0 && (
                <div className="mt-3">
                  <h6>Current Sets:</h6>
                  <Table striped bordered size="sm">
                    <thead>
                      <tr>
                        <th>Set Name</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {H.map((setName, index) => (
                        <tr key={index}>
                          <td>{setName}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => startEditing('set', index)}
                              className="me-2"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => deleteItem('set', index)}
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
        disabled={editing.transition !== null} // Disable when editing
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
        disabled={editing.transition !== null} // Disable when editing
      >
        <option value="">Select symbol</option>
        {E.map((symbol, index) => (
          <option key={index} value={symbol}>{symbol}</option>
        ))}
      </Form.Select>
    </Form.Group>

    <Form.Group className="mt-3">
      <Form.Label>Set Check</Form.Label>
      <div className="d-flex">
        <Form.Select
          value={transition.setCheck.setName}
          onChange={(e) => setTransition({
            ...transition,
            setCheck: {
              ...transition.setCheck,
              setName: e.target.value
            }
          })}
          disabled={editing.transition !== null} // Disable when editing
        >
          <option value="">Select set</option>
          {H.map((setName, index) => (
            <option key={index} value={setName}>{setName}</option>
          ))}
        </Form.Select>
        <Form.Select
          value={transition.setCheck.checkType}
          onChange={(e) => setTransition({
            ...transition,
            setCheck: {
              ...transition.setCheck,
              checkType: e.target.value
            }
          })}
          className="ms-2"
          disabled={editing.transition !== null} // Disable when editing
        >
          <option value="0">p()</option>
          <option value="1">!p()</option>
        </Form.Select>
      </div>
    </Form.Group>

    <Form.Group className="mt-3">
      <Form.Label>Next States</Form.Label>
      <div className="mb-2">
        {Q.map((state, index) => (
          <div key={index} className="d-flex align-items-center mb-2">
            <Form.Check
              type="checkbox"
              label={state}
              checked={transition.nextStates.some(ns => ns.state === state)}
              onChange={(e) => {
                if (e.target.checked) {
                  setTransition({
                    ...transition,
                    nextStates: [...transition.nextStates, { state, setInsertion: '-' }]
                  });
                } else {
                  setTransition({
                    ...transition,
                    nextStates: transition.nextStates.filter(ns => ns.state !== state)
                  });
                }
              }}
              className="me-2"
            />
            {transition.nextStates.some(ns => ns.state === state) && (
              <Form.Select
                value={transition.nextStates.find(ns => ns.state === state)?.setInsertion || '-'}
                onChange={(e) => {
                  const updated = transition.nextStates.map(ns => 
                    ns.state === state ? { ...ns, setInsertion: e.target.value } : ns
                  );
                  setTransition({...transition, nextStates: updated});
                }}
                size="sm"
                style={{ width: '100px' }}
              >
                <option value="-">No insertion</option>
                {H.map((setName, i) => (
                  <option key={i} value={setName}>ins({setName})</option>
                ))}
              </Form.Select>
            )}
          </div>
        ))}
      </div>
    </Form.Group>

    <div className="d-flex mt-3">
      <Button 
        variant={editing.transition !== null ? "success" : "primary"} 
        onClick={handleTransition}
        disabled={
          !transition.currentState || 
          !transition.inputSymbol || 
          !transition.setCheck.setName || 
          transition.nextStates.length === 0
        }
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
                        <th>Symbol</th>
                        <th>Set Check</th>
                        <th>Next States</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {T.map((t, index) => {
                        const [fromState, symbol, guardRaw, targets] = t;

                        // Convert guard: "h1,1" → !p(h1), "h1,0" → p(h1)
                        let guardText = '';
                        if (typeof guardRaw === 'string' && guardRaw.includes(',')) {
                          const [varName, flag] = guardRaw.split(',');
                          guardText = flag === '1' ? `!p(${varName})` : `p(${varName})`;
                        } else {
                          guardText = guardRaw;
                        }

                        // Format targets: "q2,h1" → (q2, ins(h1)), "q1,-" → (q1, -)
                        const targetText = Array.from(targets)
                          .map(tgt => {
                            const [state, op] = tgt.split(',');
                            return op === '-' ? `(${state}, -)` : `(${state}, ins(${op}))`;
                          })
                          .join(', ');

                        return (
                          <tr key={index}>
                            <td>{fromState}</td>
                            <td>{symbol}</td>
                            <td>{guardText}</td>
                            <td>{targetText}</td>
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
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Initial/Accepting States and Test Cases Section */}
        <Col md={4}>
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

      {/* Check Emptiness Button */}
      <div className="text-center mb-4">
        <Button 
          variant="info" 
          size="lg"
          onClick={checkEmptiness}
          disabled={
            Q.length === 0 || 
            E.length === 0 || 
            H.length === 0 ||
            T.length === 0 || 
            !q0 || 
            F.length === 0
          }
          className="me-3"
        >
          Check Emptiness
        </Button>
        {emptinessResult && (
          <span className="align-middle ms-3">
            {emptinessResult.success ? (
              emptinessResult.results ? (
                <Badge bg="danger">Language is empty</Badge>
              ) : (
                <Badge bg="success">Language is not empty</Badge>
              )
            ) : (
              <Badge bg="warning">{emptinessResult.error}</Badge>
            )}
          </span>
        )}
      </div>

      {/* Test Cases Section */}
      <div className="text-center mb-4">
        <Button 
          variant="primary" 
          size="lg"
          onClick={() => setShowTestCases(!showTestCases)}
          disabled={
            Q.length === 0 || 
            E.length === 0 || 
            H.length === 0 ||
            T.length === 0 || 
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
                  placeholder="e.g. (a,1),(b,2)"
                  isInvalid={!!errors.testCase}
                />
                <Form.Text>
                  Example: (a,1),(b,2) - Values must be positive integers
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
                      const invalidValues = testCase.filter(step => !isPositiveInteger(step[1]));
                      const isValid = invalidSymbols.length === 0 && invalidValues.length === 0;
                      
                      return (
                        <React.Fragment key={index}>
                          <tr>
                            <td rowSpan={testCase.length + 1}>{index + 1}</td>
                          </tr>
                          {testCase.map((step, i) => (
                            <tr key={`${index}-${i}`}>
                              <td>({step[0]}, {step[1]})</td>
                              {i === 0 && (
                                <>
                                  <td rowSpan={testCase.length}>
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
                                  <td rowSpan={testCase.length}>
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
                                </>
                              )}
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </Table>
                
                <div className="text-center mt-3">
                  <Button 
                    variant="success" 
                    size="lg"
                    onClick={testSAFA}
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
                          <div key={i}>({step[0]}, {step[1]}){i < result.input.length - 1 ? ', ' : ''}</div>
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
      >
        Export PDF
      </Button>
    </div>
  );
};

export default SAFAForm;