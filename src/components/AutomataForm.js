import React, { useState } from 'react';
import { Accordion, Card, Badge, Row, Col } from 'react-bootstrap';

// Import your images (replace these with your actual image paths)
import nfaImage from '../images/nfa-example.png';
import raImage from '../images/ra-example.png';
import safaImage from '../images/safa-example.png';
import ccaImage from '../images/cca-example.png';
import cmaImage from '../images/cma-example.png';


const AutomataForm = () => {
  const [activeKey, setActiveKey] = useState('0');

  // Custom CSS for perfect bullet alignment and image layout
  const customStyles = `
    .automata-container {
      text-align: left;
    }
    .automata-list {
      padding-left: 1.5rem;
    }
    .automata-list ul {
      padding-left: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .automata-list li {
      margin-bottom: 0.25rem;
    }
    .automata-card {
      text-align: left;
      margin-bottom: 1rem;
    }
    .automata-card .card-header {
      padding: 0.75rem 1rem;
      font-weight: 600;
      background-color: #f8f9fa;
    }
    .automata-card .card-body {
      padding: 1rem;
    }
    .accordion-button {
      text-align: left;
      padding: 1rem;
    }
    .accordion-button:not(.collapsed) {
      background-color: #f8f9fa;
    }
    .example-image {
      max-width: 100%;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 5px;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .example-content {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
    }
    .example-text {
      flex: 1;
      min-width: 300px;
    }
    .example-visual {
      flex: 1;
      min-width: 300px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    @media (max-width: 768px) {
      .example-content {
        flex-direction: column;
      }
    }
  `;

  const automataTypes = [
    {
      name: "Non-Deterministic Automata (NFA)",
      definition: (
        <div className="automata-list">
          <p>A non-deterministic automata (NFA) is defined as a 5-tuple M = (Q, Σ, δ, q₀, F), where:</p>
          <ul>
            <li><strong>Q</strong> is a finite set of states</li>
            <li><strong>Σ</strong> is a finite set of alphabets</li>
            <li><strong>q₀ ∈ Q</strong> is the initial state</li>
            <li><strong>F ⊆ Q</strong> is the set of accepting states</li>
            <li>The <strong>transition relation</strong> is given by δ ⊆ Q × Σ → 2<sup>Q</sup></li>
          </ul>
          <p>The automaton M accepts an input data word w if it successfully consumes the entire word and ends in a final state.</p>
        </div>
      ),
      example: (
        <div className="example-content">
          <div className="example-text">
            <div className="automata-list">
              <p><strong>Example:</strong> The language L = "String contains 2 consecutive a's" is accepted by a NFA.</p>
              <p>The NFA accepting this language is the automaton M = (Q, Σ, δ, q₀, F) where:</p>
              <ul>
                <li><strong>Q</strong> = {'{q₀, q₁, q₂}'}</li>
                <li><strong>q₀</strong> is the only initial state</li>
                <li><strong>F</strong> = {'{q₀}'}</li>
                <li><strong>Σ</strong> = {'{a, b}'}</li>
                <li><strong>δ</strong> consists of:
                  <ul>
                    <li>(q₀, a, {'{q₀, q₁}'})</li>
                    <li>(q₀, b, q₀)</li>
                    <li>(q₀, a, q₁)</li>
                    <li>(q₁, a, q₂)</li>
                    <li>(q₂, a, q₂)</li>
                    <li>(q₂, b, q₂)</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
          <div className="example-visual">
            <img src={nfaImage} alt="NFA Example Diagram" className="example-image" />
          </div>
        </div>
      )
    },
    {
      name: "Register Automata (RA)",
      definition: (
        <div className="automata-list">
          <p>A k-register automaton is a tuple (Q, Σ, δ, τ₀, U, q₀, F), where:</p>
          <ul>
            <li><strong>Q</strong> is a finite set of states</li>
            <li><strong>Σ</strong> is a finite set of alphabets</li>
            <li><strong>q₀ ∈ Q</strong> is the initial state</li>
            <li><strong>F ⊆ Q</strong> is the set of final states</li>
            <li>The <strong>initial register configuration</strong> is given by τ₀ : [k] → D ∪ {'{⊥}'}, where D is a countably infinite set of data values and ⊥ denotes an uninitialized register</li>
            <li>The <strong>transition relation</strong> is δ ⊆ Q × Σ × [k] × Q</li>
            <li><strong>U</strong> is a partial update function U : Q × Σ → [k]</li>
          </ul>
          <p>Registers are initially assumed to contain distinct data values.</p>
          <p>The automaton M accepts an input data word w if it successfully consumes the entire word and ends in a final state.</p>
        </div>
      ),
      example: (
        <div className="example-content">
          <div className="example-text">
            <div className="automata-list">
              <p><strong>Example:</strong> The language L = "Word with any data value for 'a' appearing twice" is accepted by a RA.</p>
              <p>The RA accepting this language is the automaton M = (Q, Σ, δ, τ₀, U, q₀, F) where:</p>
              <ul>
                <li><strong>Q</strong> = {'{q₀, q₁, q₂}'}</li>
                <li><strong>Σ</strong> = {'{a, b}'}</li>
                <li><strong>q₀</strong> is the only initial state</li>
                <li><strong>F</strong> = {'{q₂}'}</li>
                <li><strong>τ₀</strong> = (⊥, ⊥)</li>
                <li><strong>U</strong>:
                  <ul>
                    <li>U(q₀, Σ) = 1</li>
                    <li>U(q₁, Σ) = U(q₂, Σ) = 2</li>
                  </ul>
                </li>
                <li><strong>δ</strong> consists of:
                  <ul>
                    <li>(q₀, Σ, 1, q₀)</li>
                    <li>(q₀, a, 1, q₁)</li>
                    <li>(q₁, Σ, 2, q₁)</li>
                    <li>(q₁, a, 1, q₂)</li>
                    <li>(q₂, Σ, {'{1, 2}'}, q₂)</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
          <div className="example-visual">
            <img src={raImage} alt="RA Example Diagram" className="example-image" />
          </div>
        </div>
      )
    },
    {
      name: "Set Augmented Finite Automata (SAFA)",
      definition: (
        <div className="automata-list">
          <p>A set augmented finite automaton (SAFA) is defined as a 6-tuple M = (Q, Σ, q₀, F, H, δ), where:</p>
          <ul>
            <li><strong>Q</strong> is a finite set of states</li>
            <li><strong>Σ</strong> is a finite set of alphabets</li>
            <li><strong>D</strong> is a countably infinite set of data values</li>
            <li><strong>q₀ ∈ Q</strong> is the initial state</li>
            <li><strong>F ⊆ Q</strong> is the set of final states</li>
            <li><strong>H</strong> is a finite set of finite sets of data values</li>
            <li>The <strong>transition relation</strong> is defined as δ ⊆ Q × Σ × C × OP × Q, where:
              <ul>
                <li><strong>C</strong> = {'{p(hᵢ), !p(hᵢ) | hᵢ ∈ H}'} specifies membership or non-membership of the current data value in the i-th set of H</li>
                <li><strong>OP</strong> = {'{-, ins(hᵢ) | hᵢ ∈ H}'} defines operations, where ins(hᵢ) inserts the current data value into set hᵢ, and - indicates no operation</li>
              </ul>
            </li>
          </ul>
          <p>A SAFA accepts a data word w if, after consuming all symbols in w, it reaches a final state in F.</p>
        </div>
      ),
      example: (
        <div className="example-content">
          <div className="example-text">
            <div className="automata-list">
              <p><strong>Example:</strong> The language L<sub>fd(a)</sub> = "Data values under a are all distinct" is accepted by a SAFA.</p>
              <p>The SAFA accepting this language is the automaton M = (Q, Σ, q₀, F, H, δ) where:</p>
              <ul>
                <li><strong>Q</strong> = {'{q₀, q₁}'}</li>
                <li><strong>Σ</strong> = {'{a, b}'}</li>
                <li><strong>q₀</strong> is the only initial state</li>
                <li><strong>F</strong> = {'{q₀}'}</li>
                <li><strong>H</strong> = ∅</li>
                <li><strong>δ</strong> consists of:
                  <ul>
                    <li>(q₀, a, !p(h₁), ins(h₁), q₀)</li>
                    <li>(q₀, b, p(h₁), -, q₀)</li>
                    <li>(q₀, b, !p(h₁), -, q₀)</li>
                    <li>(q₀, a, p(h₁), -, q₁)</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
          <div className="example-visual">
            <img src={safaImage} alt="SAFA Example Diagram" className="example-image" />
          </div>
        </div>
      )
    },
    {
      name: "Class Counting Automata (CCA)",
      definition: (
        <div className="automata-list">
          <p>A class counting automaton (CCA) is defined as a 5-tuple M = (Q, Σ, δ, I, F), where:</p>
          <ul>
            <li><strong>Q</strong> is a finite set of states</li>
            <li><strong>Σ</strong> is a finite set of alphabets</li>
            <li><strong>I ⊆ Q</strong> is the initial state</li>
            <li><strong>F ⊆ Q</strong> is the set of accepting states</li>
            <li>The <strong>transition relation</strong> is given by δ ⊆ Q × Σ × C × Inst × ℕ × Q, where Inst denotes a set of register or counter update instructions,
                    <strong>C</strong> denote a collection of such constraints. A <strong>constraint C</strong> is a pair (op, e) where op ∈ {'{<, >, =, ≤, ≥, ≠}'} and e ∈ ℕ
            </li>
          </ul>
          <p>A CCA accepts a data word w if, after consuming all symbols in w, it reaches a final state in F.</p>
        </div>
      ),
      example: (
        <div className="example-content">
          <div className="example-text">
            <div className="automata-list">
              <p><strong>Example:</strong> The language L<sub>fd(a)</sub> = "Data values under a are all distinct" is accepted by a CCA.</p>
              <p>The CCA accepting this language is the automaton M = (Q, Σ, δ, I, F) where:</p>
              <ul>
                <li><strong>Q</strong> = {'{q₀, q₁}'}</li>
                <li><strong>Σ</strong> = {'{a, b}'}</li>
                <li><strong>I</strong> = {'{q₀}'}</li>
                <li><strong>F</strong> = {'{q₀}'}</li>
                <li><strong>δ</strong> consists of:
                  <ul>
                    <li>(q₀, a, (≤, 0),[+1], q₀)</li>
                    <li>(q₀, b, (≥, 0), [0], q₀)</li>
                    <li>(q₀, a, (=, 1), [0], q₁)</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
          <div className="example-visual">
            <img src={ccaImage} alt="CCA Example Diagram" className="example-image" />
          </div>
        </div>
      )
    },
    {
      name: "Class Memory Automata (CMA)",
      definition: (
        <div className="automata-list">
          <p>A class memory automaton (CMA) is a 6-tuple M = (Q, Σ, δ, q₀, F<sub>ℓ</sub>, F<sub>g</sub>), where:</p>
          <ul>
            <li><strong>Q</strong> is a finite set of states</li>
            <li><strong>Σ</strong> is a finite set of alphabets</li>
            <li><strong>q₀ ∈ Q</strong> is the initial state</li>
            <li><strong>F<sub>g</sub> ⊆ F<sub>ℓ</sub> ⊆ Q</strong> are sets of global and local accepting states, respectively</li>
            <li>The <strong>transition relation</strong> is δ ⊆ Q × Σ × (Q ∪ {'{⊥}'}) × Q</li>
          </ul>
          <p>The automaton maintains, for each data value d encountered, the last state in which d was read. If a data value d has not yet been seen, it is associated with ⊥. Each transition depends on the current state of the automaton and the state associated with the data value currently being read.</p>
          <p>A data word w is accepted by the automaton if it reaches a state q ∈ F<sub>g</sub> and, for every data value d seen in w, the last state associated with d belongs to F<sub>ℓ</sub>.</p>
        </div>
      ),
      example: (
        <div className="example-content">
          <div className="example-text">
            <div className="automata-list">
              <p><strong>Example:</strong> The language L<sub>fd(a)</sub> = "Data values under a are all distinct" is accepted by a CMA.</p>
              <p>The CMA accepting this language is the automaton M = (Q, Σ, δ, q₀, F<sub>ℓ</sub>, F<sub>g</sub>) where:</p>
              <ul>
                <li><strong>Q</strong> = {'{'}q₀, q<sub>a</sub>, q<sub>b</sub>{'}'} be the set of states</li>
                <li><strong>Σ</strong> = {'{a, b}'}</li>
                <li><strong>q₀</strong> is the only initial state</li>
                <li>The <strong>transition relation δ</strong> contains:
                  <ul>
                    <li>(p, a, ⊥, q<sub>a</sub>)</li>
                    <li>(p, b, ⊥, q<sub>b</sub>)</li>
                    <li>(p, a, ⊥, q<sub>a</sub>)</li>
                    <li>(p, b, q<sub>b</sub>, q<sub>b</sub>)</li>
                    <li>(p, a, q<sub>a</sub>, q<sub>a</sub>)</li>
                    where p ∈ {'{'}q₀, q<sub>a</sub>, q<sub>b</sub>{'}'}
                  </ul>
                </li>
                <li>The <strong>local accepting set</strong> is F<sub>ℓ</sub> = {'{'}q₀, q<sub>a</sub>, q<sub>b</sub>{'}'}</li>
                <li>The <strong>global accepting set</strong> is F<sub>g</sub> = {'{'}q₀, q<sub>a</sub>, q<sub>b</sub>{'}'}</li>
              </ul>
            </div>
          </div>
          {/* <div className="example-visual">
            <img src={cmaImage} alt="CMA Example Diagram" className="example-image" />
          </div> */}
        </div>
      )
    }
  ];

  return (
    <div className="container mt-4 automata-container">
      <style>{customStyles}</style>
      <h2 className="mb-4">Automata Definitions</h2>
      
      <Accordion activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
        {automataTypes.map((automata, index) => (
          <Accordion.Item eventKey={index.toString()} key={index}>
            <Accordion.Header>
              <Badge bg="primary" className="me-2">{index + 1}</Badge>
              {automata.name}
            </Accordion.Header>
            <Accordion.Body>
              <Card className="automata-card">
                <Card.Header>Definition</Card.Header>
                <Card.Body>
                  {automata.definition}
                </Card.Body>
              </Card>
              
              <Card className="automata-card">
                <Card.Header>Example</Card.Header>
                <Card.Body>
                  {automata.example}
                </Card.Body>
              </Card>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
};

export default AutomataForm;