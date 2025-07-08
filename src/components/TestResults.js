import React from 'react';
import { Card, Table, Alert, Badge } from 'react-bootstrap';

const TestResults = ({ results }) => {
  if (!results.length ===0 ) return null;

  return (
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
                  <td>{result.input}</td>
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
  );
};

export default TestResults;