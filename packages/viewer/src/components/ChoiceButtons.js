import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Choice buttons component for navigating between sections.
 */
import { Row, Col, Button } from 'react-bootstrap';
export function ChoiceButtons({ choices, onChoiceClick }) {
    if (!choices || choices.length === 0) {
        return null;
    }
    return (_jsx(Row, { id: "choices_row", style: { marginTop: '5px' }, children: choices.map((choice, index) => (_jsx(Col, { style: { textAlign: 'center' }, children: _jsx(Button, { type: "button", variant: "primary", onClick: () => onChoiceClick(choice.next), style: { fontSize: 'x-large' }, children: choice.text || '→' }) }, index))) }));
}
