import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Table, Alert, Badge } from 'react-bootstrap';
import { faEdit, faTrash, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { jsPDF } from 'jspdf';

const CMAForm = () => {
  // CMA Components
  const [Q, setQ] = useState([]); // States
  const [E, setE] = useState([]); // Alphabet
  const [T, setT] = useState([]); // Transitions
  const [q0, setQ0] = useState(''); // Initial state (single)
  const [Fl, setFl] = useState([]); // Local accepting states
  const [Fg, setFg] = useState([]); // Global accepting states
  const [testCases, setTestCases] = useState([]); // Test cases
  const [results, setResults] = useState(null); // Test results
  const [languageDescription, setLanguageDescription] = useState('');

  // Form inputs
  const [newState, setNewState] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [transition, setTransition] = useState({
    currentState: '',
    inputSymbol: '',
    lastOccuranceState: '-',
    nextStates: []
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
    transition: null,
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

    if (Q.includes(newState) && editing.state === null) {
      setErrors({...errors, general: `State ${newState} already exists`});
      return;
    }

    if (editing.state !== null) {
      // Update existing state
      const updatedQ = [...Q];
      updatedQ[editing.state] = newState;
      
      // Update all references
      const updatedT = T.map(t => [
        t[0] === Q[editing.state] ? newState : t[0],
        t[1],
        t[2] === Q[editing.state] ? newState : t[2],
        new Set(Array.from(t[3]).map(s => s === Q[editing.state] ? newState : s))
      ]);
      
      setQ(updatedQ);
      setT(updatedT);
      setQ0(q0 === Q[editing.state] ? newState : q0);
      setFl(Fl.map(s => s === Q[editing.state] ? newState : s));
      setFg(Fg.map(s => s === Q[editing.state] ? newState : s));
      setEditing({...editing, state: null});
    } else {
      // Add new state
      setQ([...Q, newState]);
    }
    setNewState('');
    setErrors({...errors, general: ''});
  };

  // Alphabet management
  const handleSymbol = () => {
    if (!newSymbol) return;

    if (E.includes(newSymbol) && editing.symbol === null) {
      setErrors({...errors, general: `Symbol ${newSymbol} already exists`});
      return;
    }

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
      // Add new symbol
      setE([...E, newSymbol]);
    }
    setNewSymbol('');
    setErrors({...errors, general: ''});
  };

  // Transition management
  const handleTransition = () => {
  if (!transition.currentState || !transition.inputSymbol || transition.nextStates.length === 0) {
    setErrors({...errors, general: 'Please fill all transition fields'});
    return;
  }

  // Check for existing transition with same currentState, inputSymbol, and lastOccuranceState
  const existingTransitionIndex = T.findIndex(t => 
    t[0] === transition.currentState && 
    t[1] === transition.inputSymbol &&
    t[2] === transition.lastOccuranceState
  );

  if (existingTransitionIndex !== -1 && editing.transition === null) {
    // Merge next states with existing transition
    const existingNextStates = Array.from(T[existingTransitionIndex][3]);
    const mergedNextStates = [...new Set([...existingNextStates, ...transition.nextStates])];
    
    const updatedTransition = [
      transition.currentState,
      transition.inputSymbol,
      transition.lastOccuranceState,
      new Set(mergedNextStates)
    ];

    // Update the existing transition
    const updatedT = [...T];
    updatedT[existingTransitionIndex] = updatedTransition;
    setT(updatedT);
  } else if (editing.transition !== null) {
    // Update existing transition (editing mode)
    const updatedT = [...T];
    updatedT[editing.transition] = [
      transition.currentState,
      transition.inputSymbol,
      transition.lastOccuranceState,
      new Set(transition.nextStates)
    ];
    setT(updatedT);
    setEditing({...editing, transition: null});
  } else {
    // Add new transition
    setT([...T, [
      transition.currentState,
      transition.inputSymbol,
      transition.lastOccuranceState,
      new Set(transition.nextStates)
    ]]);
  }
  
  // Reset form
  setTransition({
    currentState: '',
    inputSymbol: '',
    lastOccuranceState: '-',
    nextStates: []
  });
  setErrors({...errors, general: ''});
};

  // Parse test case input in format (a,1),(b,2)
  const parseTestCaseInput = (input) => {
    // Remove all whitespace
    const cleanedInput = input.replace(/\s/g, '');
    
    // Check for valid format
    const testCaseRegex = /^(?:\(([^,]+),([0-9]+)\))(?:,\(([^,]+),([0-9]+)\))*$/;
    if (!testCaseRegex.test(cleanedInput)) {
      return { valid: false, error: 'Invalid format. Use (symbol,value),(symbol,value),...' };
    }
    
    // Extract all pairs
    const pairs = cleanedInput.match(/\(([^,]+),([0-9]+)\)/g);
    if (!pairs || pairs.length === 0) {
      return { valid: false, error: 'No valid test cases found' };
    }
    
    // Process each pair
    const steps = [];
    for (const pair of pairs) {
      const match = pair.match(/\(([^,]+),([0-9]+)\)/);
      if (!match) continue;
      
      const symbol = match[1];
      const value = match[2];
      
      if (!E.includes(symbol)) {
        return { valid: false, error: `Symbol '${symbol}' is not in the alphabet` };
      }
      
      if (!isPositiveInteger(value)) {
        return { valid: false, error: `Value '${value}' must be a positive integer` };
      }
      
      steps.push([symbol, value]);
    }
    
    return { valid: true, steps };
  };

  // Add/edit complete test case
  const handleTestCase = () => {
    if (!testCaseInput) {
      setErrors({...errors, testCase: 'Please enter test cases'});
      return;
    }
    
    const { valid, error, steps } = parseTestCaseInput(testCaseInput);
    if (!valid) {
      setErrors({...errors, testCase: error});
      return;
    }
    
    if (editing.testCase !== null) {
      // Update existing test case
      const updatedTestCases = [...testCases];
      updatedTestCases[editing.testCase] = steps;
      setTestCases(updatedTestCases);
      setEditing({...editing, testCase: null});
    } else {
      // Add new test case
      setTestCases([...testCases, steps]);
    }
    
    setTestCaseInput('');
    setErrors({...errors, testCase: ''});
    // setShowTestCases(false);
  };

  // Validate all test cases
  const validateTestCases = () => {
    if (E.length === 0 || testCases.length === 0) return;

    const invalidCases = testCases.some(testCase => 
      testCase.some(step => !isPositiveInteger(step[1]))
    );
    
    if (invalidCases || errors.testCase) {
      setErrors({...errors, general: 'Please fix all invalid test cases before testing'});
    } else {
      setErrors({...errors, general: ''});
    }
  };

  // Delete operations
  const deleteItem = (type, index) => {
    switch (type) {
      case 'state':
        // Check if state is in use
        const isStateUsed = 
          q0 === Q[index] || 
          Fl.includes(Q[index]) || 
          Fg.includes(Q[index]) || 
          T.some(t => t[0] === Q[index] || t[2] === Q[index] || Array.from(t[3]).includes(Q[index]));
        
        if (isStateUsed) {
          setErrors({...errors, general: `Cannot delete state ${Q[index]} as it's being used`});
          return;
        }
        setQ(Q.filter((_, i) => i !== index));
        break;
      
      case 'symbol':
        // Check if symbol is in use
        const isSymbolUsed = T.some(t => t[1] === E[index]);
        
        if (isSymbolUsed) {
          setErrors({...errors, general: `Cannot delete symbol ${E[index]} as it's being used`});
          return;
        }
        setE(E.filter((_, i) => i !== index));
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
      
      case 'transition':
        const t = T[index];
        setTransition({
          currentState: t[0],
          inputSymbol: t[1],
          lastOccuranceState: t[2],
          nextStates: Array.from(t[3])
        });
        break;
      
      case 'testCase':
        const testCase = testCases[index];
        setTestCaseInput(testCase.map(step => `(${step[0]},${step[1]})`).join(','));
        setShowTestCases(true);
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
      
      case 'transition':
        setTransition({
          currentState: '',
          inputSymbol: '',
          lastOccuranceState: '-',
          nextStates: []
        });
        break;
      
      case 'testCase':
        setTestCaseInput('');
        setShowTestCases(false);
        break;
      
      default:
        break;
    }
  };

  const clearForm = () => {
    setQ([]);
    setE([]);
    setT([]);
    setQ0('');
    setFl([]);
    setFg([]);
    setTestCases([]);
    setResults(null);
    setNewState('');
    setNewSymbol('');
    setTransition({
      currentState: '',
      inputSymbol: '',
      lastOccuranceState: '-',
      nextStates: []
    });
    setTestCaseInput('');
    setErrors({ testCase: '', general: '' });
    setEditing({
      state: null,
      symbol: null,
      transition: null,
      testCase: null
    });
    setShowTestCases(false);
  };

  // Test CMA
  const testCMA = async () => {
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
          automata_type: 'CMA',
          config: {
            Q: Array.from(Q),
            E: Array.from(E),
            T: T.map(t => [t[0], t[1], t[2], Array.from(t[3])]),
            q0,
            Fl: Array.from(Fl),
            Fg: Array.from(Fg)
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

 const generateStructuredPDF = () => {
  const pdf = new jsPDF();
  let y = 20; // Vertical position tracker
  
  // PDF Styles
  const titleStyle = { fontSize: 16, fontStyle: 'bold' };
  const sectionStyle = { fontSize: 14, fontStyle: 'bold' };
  const textStyle = { fontSize: 12 };
  const tableHeaderStyle = { fontSize: 12, fontStyle: 'bold' };
  const lineHeight = 6;
  const cellPadding = 3;
  
  // Add Language Description
  if (languageDescription) {
    pdf.setFontSize(titleStyle.fontSize);
    pdf.setFont(undefined, titleStyle.fontStyle);
    pdf.text('Language Description', 105, y, { align: 'center' });
    y += 10;
    
    pdf.setFontSize(textStyle.fontSize);
    pdf.setFont(undefined, 'normal');
    const splitDesc = pdf.splitTextToSize(languageDescription, 180);
    pdf.text(splitDesc, 20, y + 10);
    y += 10 + (splitDesc.length * 7);
  }
  
  // Add Configuration Section
  pdf.setFontSize(sectionStyle.fontSize);
  pdf.setFont(undefined, sectionStyle.fontStyle);
  pdf.text('CMA Configuration', 105, y, { align: 'center' });
  y += 10;
  
  pdf.setFontSize(textStyle.fontSize);
  pdf.setFont(undefined, 'normal');
  
  // States
  pdf.text(`• States (Q): ${Q.join(', ')}`, 20, y);
  y += 10;
  pdf.text(`• Initial State (q0): ${q0}`, 20, y);
  y += 10;
  pdf.text(`• Local Accepting States (Fl): ${Fl.join(', ')}`, 20, y);
  y += 10;
  pdf.text(`• Global Accepting States (Fg): ${Fg.join(', ')}`, 20, y);
  y += 10;
  
  // Alphabet
  pdf.text(`• Alphabet (E): ${E.join(', ')}`, 20, y);
  y += 10;
  
  // Transitions Table
  pdf.text('• Transitions (T): ', 20, y);
  y += 10;

  // Draw transitions table
  const drawTransitionTable = (data, startY) => {
    // Calculate column widths
    const colWidths = [30, 25, 50, 65]; // State, Symbol, Last Occurrence, Next States
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const tableX = 20;
    const headerHeight = lineHeight + cellPadding * 2;
    
    // Header
    pdf.setFontSize(tableHeaderStyle.fontSize);
    pdf.setFont(undefined, tableHeaderStyle.fontStyle);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(tableX, startY, totalWidth, headerHeight, 'F');
    pdf.setDrawColor(0);
    pdf.rect(tableX, startY, totalWidth, headerHeight);
    
    let x = tableX;
    ['State', 'Symbol', 'Last Occurrence', 'Next States'].forEach((header, i) => {
      pdf.text(header, x + colWidths[i]/2, startY + headerHeight/2 + 3, { align: 'center' });
      if (i < 3) {
        pdf.line(x + colWidths[i], startY, x + colWidths[i], startY + headerHeight);
      }
      x += colWidths[i];
    });

    // Rows
    pdf.setFontSize(textStyle.fontSize);
    let currentY = startY + headerHeight;
    
    data.forEach((t, rowIndex) => {
      // Prepare row data
      const row = [
        t[0], // State
        t[1], // Symbol
        t[2], // Last Occurrence
        Array.from(t[3]).join(', ') // Next States
      ];
      
      // Calculate required row height
      let rowHeight = lineHeight + cellPadding * 2;
      const cellHeights = [];
      
      row.forEach((cell, colIdx) => {
        const cellHeight = pdf.getTextDimensions(cell, { maxWidth: colWidths[colIdx] - cellPadding * 2 }).h + cellPadding * 2;
        cellHeights.push(cellHeight);
        rowHeight = Math.max(rowHeight, cellHeight);
      });

      // Check for page break
      if (currentY + rowHeight > 280) {
        pdf.addPage();
        currentY = 20;
        // Redraw header
        pdf.setFontSize(tableHeaderStyle.fontSize);
        pdf.setFont(undefined, tableHeaderStyle.fontStyle);
        pdf.setFillColor(240, 240, 240);
        pdf.rect(tableX, currentY, totalWidth, headerHeight, 'F');
        pdf.setDrawColor(0);
        pdf.rect(tableX, currentY, totalWidth, headerHeight);
        
        x = tableX;
        ['State', 'Symbol', 'Last Occurrence', 'Next States'].forEach((header, i) => {
          pdf.text(header, x + colWidths[i]/2, currentY + headerHeight/2 + 3, { align: 'center' });
          if (i < 3) {
            pdf.line(x + colWidths[i], currentY, x + colWidths[i], currentY + headerHeight);
          }
          x += colWidths[i];
        });
        currentY += headerHeight;
        pdf.setFontSize(textStyle.fontSize);
      }

      // Alternate row color
      pdf.setFillColor(rowIndex % 2 === 0 ? (255, 255, 255) : (248, 248, 248));
      pdf.rect(tableX, currentY, totalWidth, rowHeight, 'F');
      pdf.setDrawColor(200);
      pdf.rect(tableX, currentY, totalWidth, rowHeight);

      // Draw cells
      x = tableX;
      row.forEach((cell, colIdx) => {
        const lines = pdf.splitTextToSize(cell, colWidths[colIdx] - cellPadding * 2);
        const textY = currentY + (rowHeight/2) - ((lines.length-1)*lineHeight/2);
        
        if (colIdx < 3) {
          pdf.line(x + colWidths[colIdx], currentY, x + colWidths[colIdx], currentY + rowHeight);
        }

        pdf.setFontSize(textStyle.fontSize);
        pdf.setFont(undefined, 'normal');
        
        pdf.text(lines, x + colWidths[colIdx]/2, textY, { 
          align: 'center',
          maxWidth: colWidths[colIdx] - cellPadding * 2
        });
        
        x += colWidths[colIdx];
      });

      currentY += rowHeight;
    });

    return currentY;
  };

  y = drawTransitionTable(T, y) + 10;
  
  // Test Cases and Results (merged section)
  if (testCases.length > 0) {
    y += 10;
    pdf.setFontSize(sectionStyle.fontSize);
    pdf.setFont(undefined, sectionStyle.fontStyle);
    pdf.text('Test Cases & Results', 105, y, { align: 'center' });
    y += 10;
    
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
  pdf.save(`CMA_Report_${new Date().toISOString().slice(0,10)}.pdf`);
};

  return (
    <div className="container mt-4">
      <h2 className="mb-4">CMA Configuration</h2>
      
      {errors.general && <Alert variant="danger">{errors.general}</Alert>}

      <Card className="mb-4">
        <Card.Header>Language Description</Card.Header>
        <Card.Body>
          <Form.Control
            as="textarea"
            rows={3}
            value={languageDescription}
            onChange={(e) => setLanguageDescription(e.target.value)}
            placeholder="Enter a description of the language this CMA recognizes"
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
                            {Fl.includes(state) && <Badge bg="warning" className="ms-2">Local</Badge>}
                            {Fg.includes(state) && <Badge bg="success" className="ms-2">Global</Badge>}
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

        {/* Transitions Section */}
        <Col md={4}>
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
                <Form.Label>Last Occurrence State</Form.Label>
                <Form.Select
                  value={transition.lastOccuranceState}
                  onChange={(e) => setTransition({...transition, lastOccuranceState: e.target.value})}
                >
                  <option value="-">- (No last occurrence)</option>
                  {Q.map((state, index) => (
                    <option key={index} value={state}>{state}</option>
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
                  disabled={
                    !transition.currentState || 
                    !transition.inputSymbol || 
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
                        <th>Last Occurrence</th>
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

        {/* Initial/Accepting States Section */}
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

          {/* Local Accepting States Section */}
          <Card className="mb-4">
            <Card.Header>Local Accepting States (Fl)</Card.Header>
            <Card.Body>
              <Form.Group>
                {Q.map((state, index) => (
                  <Form.Check
                    key={index}
                    type="checkbox"
                    label={state}
                    checked={Fl.includes(state)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFl([...Fl, state]);
                      } else {
                        setFl(Fl.filter(s => s !== state));
                      }
                    }}
                  />
                ))}
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Global Accepting States Section */}
          <Card className="mb-4">
            <Card.Header>Global Accepting States (Fg)</Card.Header>
            <Card.Body>
              <Form.Group>
                {Q.map((state, index) => (
                  <Form.Check
                    key={index}
                    type="checkbox"
                    label={state}
                    checked={Fg.includes(state)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFg([...Fg, state]);
                      } else {
                        setFg(Fg.filter(s => s !== state));
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
            T.length === 0 || 
            !q0 || 
            Fl.length === 0 || 
            Fg.length === 0
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
                <Form.Label>Enter test case in format (symbol,value)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={testCaseInput}
                  onChange={(e) => setTestCaseInput(e.target.value)}
                  placeholder="e.g. (a,187),(b,228),(a,848)"
                  isInvalid={!!errors.testCase}
                />
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
                    onClick={() => {
                      cancelEditing('testCase');
                      // setShowTestCases(false);
                    }} 
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
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            {testCase.map((step, i) => (
                              <span key={i}>
                                ({step[0]}, {step[1]}){i < testCase.length - 1 ? ', ' : ''}
                              </span>
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
                    onClick={testCMA}
                    disabled={
                      testCases.length === 0 ||
                      !!errors.testCase
                    }
                  >
                    Test CMA
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
      <div className="text-center mb-4">  
        <Button 
          variant="info" 
          size="lg"
          onClick={generateStructuredPDF}
          disabled={Q.length === 0}
        >
          Export PDF
        </Button>
      </div>
    </div>    
  );
};

export default CMAForm;