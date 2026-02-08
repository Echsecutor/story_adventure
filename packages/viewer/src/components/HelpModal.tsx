/**
 * Help modal component displaying hotkey information.
 */

import { Modal, Table } from 'react-bootstrap';

interface HotkeyDefinition {
  description: string;
  aliases?: string[];
}

interface HelpModalProps {
  show: boolean;
  onHide: () => void;
  hotkeys: Record<string, HotkeyDefinition>;
}

export function HelpModal({ show, onHide, hotkeys }: HelpModalProps) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      id="help_modal"
      tabIndex={-1}
      aria-labelledby="help_modal_label"
    >
      <Modal.Header closeButton>
        <Modal.Title id="help_modal_label">Help</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Use the following hotkeys anywhere in the viewer:</p>
        <Table>
          <thead>
            <tr>
              <th scope="col">Key</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(hotkeys).map(([key, def]) => {
              const keys = [key, ...(def.aliases || [])];
              return (
                <tr key={key}>
                  <td>
                    <strong>{keys.join(', ')}</strong>
                  </td>
                  <td>{def.description}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Modal.Body>
    </Modal>
  );
}
