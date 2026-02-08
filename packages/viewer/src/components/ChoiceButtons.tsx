/**
 * Choice buttons component for navigating between sections.
 */

import { Row, Col, Button } from 'react-bootstrap';
import type { Choice } from '@story-adventure/shared';

interface ChoiceButtonsProps {
  choices: Choice[];
  onChoiceClick: (next: string | number) => void;
}

export function ChoiceButtons({ choices, onChoiceClick }: ChoiceButtonsProps) {
  if (!choices || choices.length === 0) {
    return null;
  }

  return (
    <Row id="choices_row" style={{ marginTop: '5px' }}>
      {choices.map((choice, index) => (
        <Col key={index} style={{ textAlign: 'center' }}>
          <Button
            type="button"
            variant="primary"
            onClick={() => onChoiceClick(choice.next)}
            style={{ fontSize: 'x-large' }}
          >
            {choice.text || '→'}
          </Button>
        </Col>
      ))}
    </Row>
  );
}
