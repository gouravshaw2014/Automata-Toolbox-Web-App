import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Table, Alert, Badge } from 'react-bootstrap';
import TestResults from './TestResults';
import { faEdit, faTrash, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { jsPDF } from 'jspdf';

const NFAForm = () => {
  // State declarations
  const [Q, setQ] = useState([]);
  const [E, setE] = useState([]);
  const [T, setT] = useState([]);
  const [q0, setQ0] = useState([]);
  const [F, setF] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [results, setResults] = useState(null);
  const [newState, setNewState] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [languageDescription, setLanguageDescription] = useState('');
  const [transition, setTransition] = useState({
    currentState: '',
    inputSymbol: '',
    nextStates: []
  });
  const [newTestCase, setNewTestCase] = useState('');
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
  const [emptinessResult, setEmptinessResult] = useState(null);

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
    
    // Update transitions, initial states, and accepting states if they used this state
    const updatedT = T.map(t => [
      t[0] === Q[editing.state] ? newState : t[0],
      t[1],
      new Set(Array.from(t[2]).map(s => s === Q[editing.state] ? newState : s))
    ]);
    
    const updatedQ0 = q0.map(s => s === Q[editing.state] ? newState : s);
    const updatedF = F.map(s => s === Q[editing.state] ? newState : s);
    
    setQ(updatedQ);
    setT(mergeTransitions(updatedT)); // Merge after state update
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
      
      // Update transitions that used this symbol
      const updatedT = T.map(t => [
        t[0],
        t[1] === E[editing.symbol] ? newSymbol : t[1],
        t[2]
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

  // Add/edit transition
  const handleTransition = () => {
  if (!transition.currentState || !transition.inputSymbol || transition.nextStates.length === 0) {
    setErrors({...errors, general: 'Please fill all transition fields'});
    return;
  }

  let updatedT;
  if (editing.transition !== null) {
    // Update existing transition
    updatedT = [...T];
    updatedT[editing.transition] = [
      transition.currentState,
      transition.inputSymbol,
      new Set(transition.nextStates)
    ];
  } else {
    // Add new transition
    updatedT = [
      ...T,
      [
        transition.currentState,
        transition.inputSymbol,
        new Set(transition.nextStates)
      ]
    ];
  }
  
  // Merge transitions after adding/updating
  setT(mergeTransitions(updatedT));
  
  setTransition({
    currentState: '',
    inputSymbol: '',
    nextStates: []
  });
  setEditing({...editing, transition: null});
  setErrors({...errors, general: ''});
};

  const mergeTransitions = (transitions) => {
  const merged = {};
  
  transitions.forEach(t => {
    const key = `${t[0]}-${t[1]}`;
    if (!merged[key]) {
      merged[key] = {
        currentState: t[0],
        inputSymbol: t[1],
        nextStates: new Set(t[2])
      };
    } else {
      t[2].forEach(state => merged[key].nextStates.add(state));
    }
  });
  
  return Object.values(merged).map(t => [t.currentState, t.inputSymbol, t.nextStates]);
};

  // Add/edit test case
  const handleTestCase = () => {
    if (!newTestCase) return;

    // Validate test case characters
    const invalidChars = [...newTestCase].filter(c => !E.includes(c));
    if (invalidChars.length > 0) {
      setErrors({
        ...errors,
        testCase: `Invalid characters in test case: ${[...new Set(invalidChars)].join(', ')}`
      });
      return;
    }

    if (editing.testCase !== null) {
      // Update existing test case
      const updatedTestCases = [...testCases];
      updatedTestCases[editing.testCase] = newTestCase;
      setTestCases(updatedTestCases);
      setEditing({...editing, testCase: null});
    } else {
      // Add new test case - duplicates allowed
      setTestCases([...testCases, newTestCase]);
    }
    
    setNewTestCase('');
    setErrors({...errors, testCase: ''});
  };

  // Validate all test cases
  const validateTestCases = () => {
    if (E.length === 0 || testCases.length === 0) return;

    const invalidCases = testCases.map(testCase => {
      const invalidChars = [...testCase].filter(c => !E.includes(c));
      return {
        testCase,
        invalidChars: [...new Set(invalidChars)],
        isValid: invalidChars.length === 0
      };
    });

    const hasInvalidCases = invalidCases.some(c => !c.isValid);
    
    if (hasInvalidCases) {
      const errorMessages = invalidCases
        .filter(c => !c.isValid)
        .map(c => `"${c.testCase}" has invalid characters: ${c.invalidChars.join(', ')}`)
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
        // Don't allow deletion if state is used in transitions, initial state, or accepting states
        const isStateUsed = 
          q0 === Q[index] || 
          F.includes(Q[index]) || 
          T.some(t => t[0] === Q[index] || Array.from(t[2]).includes(Q[index]));
        
        if (isStateUsed) {
          setErrors({...errors, general: `Cannot delete state ${Q[index]} as it's being used`});
          return;
        }
        
        setQ(Q.filter((_, i) => i !== index));
        break;
      
      case 'symbol':
        // Don't allow deletion if symbol is used in transitions
        const isSymbolUsed = T.some(t => t[1] === E[index]);
        
        if (isSymbolUsed) {
          setErrors({...errors, general: `Cannot delete symbol ${E[index]} as it's being used in transitions`});
          return;
        }
        
        setE(E.filter((_, i) => i !== index));
        break;
      
      case 'transition':
        const transitionToDelete = T[index];
        setT(T.filter(t => t[0] !== transitionToDelete[0] || t[1] !== transitionToDelete[1]));
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
      
      case 'transition':
        const t = mergeTransitions(T)[index];
        setTransition({
          currentState: t[0],
          inputSymbol: t[1],
          nextStates: Array.from(t[2])
        });
        // Find the original index in the unmerged array
        const originalIndex = T.findIndex(tr => tr[0] === t[0] && tr[1] === t[1]);
        setEditing({...editing, transition: originalIndex});
        break;
      
      case 'testCase':
        setNewTestCase(testCases[index]);
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
          nextStates: []
        });
        break;
      
      case 'testCase':
        setNewTestCase('');
        break;
      
      default:
        break;
    }
  };

  const clearForm = () => {
    setQ([]);
    setE([]);
    setT([]);
    setQ0([]);
    setF([]);
    setTestCases([]);
    setResults(null);
    setNewState('');
    setNewSymbol('');
    setTransition({
      currentState: '',
      inputSymbol: '',
      nextStates: []
    });
    setNewTestCase('');
    setErrors({ testCase: '', general: '' });
    setEditing({
      state: null,
      symbol: null,
      transition: null,
      testCase: null
    });
    setShowTestCases(false);
    setEmptinessResult(null);
  };

  const exportToStructuredPDF = () => {
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
    pdf.text('NFA Configuration', 15, y + 20);
    y += 30;
    
    pdf.setFontSize(textStyle.fontSize);
    pdf.setFont(undefined, 'normal');
    
    // States
    pdf.text(`• States (Q): ${Q.join(', ')}`, 20, y);
    y += 10;
    pdf.text(`• Initial State (q0): ${q0.join(', ')}`, 20, y);
    y += 10;
    pdf.text(`• Accepting States (F): ${F.join(', ')}`, 20, y);
    y += 10;  
    // Alphabet
    pdf.text(`• Alphabet (E): ${E.join(', ')}`, 20, y);
    y += 10;
    
    // Transitions (with formatted header)
    pdf.text('• Transitions (T): ', 20, y);
    y += 10;

    pdf.text('(Current State, Symbol) --> Next States', 25, y);
    y += 10;
    
    T.forEach((t, i) => {
      const symbol = t[1] === 'ε' ? 'epsilon' : t[1];
      const transitionText = `${i+1}. ( ${t[0]}, ${symbol} ) --> ${Array.from(t[2]).join(', ')}`;
      
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
          pdf.text('Emptiness Result : NFA launguage is empty', 15, y);
        }else{
          pdf.text('Emptiness Result : NFA launguage is not empty', 15, y);
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
        const testCaseText = `Test ${i+1}: ${testCase}`;
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
    pdf.save(`NFA_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const checkEmptiness = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/check-emptiness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          automata_type: 'NFA',
          config: {
            Q: Array.from(Q),
            E: Array.from(E),
            T: mergeTransitions(T).map(t => [t[0], t[1], Array.from(t[2])]),
            q0: Array.from(q0), 
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

  const testAutomaton = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/process-automata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          automata_type: 'NFA',
          config: {
            Q: Array.from(Q),
            E: Array.from(E),
            T: mergeTransitions(T).map(t => [t[0], t[1], Array.from(t[2])]),
            q0: Array.from(q0),
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
    <div>
      <h2 className="mb-4">Non Deterministic Finite Automaton (NFA) Configuration</h2>
      
      {errors.general && <Alert variant="danger">{errors.general}</Alert>}

      <Card className="mb-4">
          <Card.Header>Language Description</Card.Header>
          <Card.Body>
            <Form.Control
              as="textarea"
              rows={3}
              value={languageDescription}
              onChange={(e) => setLanguageDescription(e.target.value)}
              placeholder="Enter a description of the language this NFA recognizes"
            />
          </Card.Body>
      </Card>
      
      <Row>
        <Col md={6}>
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
                            {q0.includes(state) && <Badge bg="info" className="ms-2">Initial</Badge>}
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

        <Col md={6}>
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
                  <option value="ε">ε (epsilon)</option>
                  {E.map((symbol, index) => (
                    <option key={index} value={symbol}>{symbol}</option>
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
                  disabled={!transition.currentState || !transition.inputSymbol || transition.nextStates.length === 0}
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
                        <th>Next States</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mergeTransitions(T).map((t, index) => (
                        <tr key={index}>
                          <td>{t[0]}</td>
                          <td>{t[1]}</td>
                          <td>{Array.from(t[2]).join(', ')}</td>
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
      </Row>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>Initial States (q0)</Card.Header>
              <Card.Body>
                <Form.Group>
                  {Q.map((state, index) => (
                    <Form.Check
                      key={index}
                      type="checkbox"
                      label={state}
                      checked={q0.includes(state)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setQ0([...q0, state]);
                        } else {
                          setQ0(q0.filter(s => s !== state));
                        }
                      }}
                    />
                  ))}
                </Form.Group>
              </Card.Body>
            </Card>
        </Col>

        <Col md={6}>
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
          variant="info" 
          size="lg"
          onClick={checkEmptiness}
          disabled={
            Q.length === 0 || 
            E.length === 0 || 
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
                {editing.testCase !== null ? `Editing Test Case ${testCases[editing.testCase]}` : 'Add Test Case'}
              </Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={newTestCase}
                  onChange={(e) => setNewTestCase(e.target.value)}
                  placeholder="e.g. aabba"
                  isInvalid={!!errors.testCase}
                />
                <Button 
                  variant={editing.testCase !== null ? "success" : "primary"} 
                  onClick={handleTestCase} 
                  className="ms-2"
                  disabled={!newTestCase}
                >
                  {editing.testCase !== null ? 'Update' : 'Add'}
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
              {errors.testCase && (
                <Form.Text className="text-danger">
                  {errors.testCase}
                </Form.Text>
              )}
            </Form.Group>
            
            {testCases.length > 0 && (
              <div className="mt-3">
                <h6>Current Test Cases:</h6>
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>Test Case</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testCases.map((testCase, index) => {
                      const invalidChars = [...testCase].filter(c => !E.includes(c));
                      const isValid = invalidChars.length === 0;
                      
                      return (
                        <tr key={index}>
                          <td>{testCase}</td>
                          <td>
                            {isValid ? (
                              <span className="text-success">
                                <FontAwesomeIcon icon={faCheck} className="me-1" />
                                Valid
                              </span>
                            ) : (
                              <span className="text-danger">
                                <FontAwesomeIcon icon={faTimes} className="me-1" />
                                Invalid characters: {[...new Set(invalidChars)].join(', ')}
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

      {results && <TestResults results={results} />}
      <Button 
        variant="info" 
        size="lg"
        onClick={exportToStructuredPDF}
        disabled={Q.length === 0}
        className="me-3"
      >
        Export PDF
      </Button>
    </div>
  );
};

export default NFAForm;
