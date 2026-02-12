/**
 * Navigation bar component with File and Edit menus.
 */

import { Navbar as BootstrapNavbar, Nav, NavDropdown, Container } from 'react-bootstrap';

export interface NavbarProps {
  onNewStory: () => void;
  onLoadStory: () => void;
  onSaveStory: () => void;
  onSaveStoryWithImages: () => void;
  onGenerateBundle: () => void;
  onCreateLinearStory: () => void;
  onAddSection: () => void;
  onRedraw: () => void;
  onShowVariables: () => void;
  onShowJson: () => void;
  onShowMetadata: () => void;
  onShowAISettings: () => void;
}

/**
 * Navigation bar with File and Edit menus.
 */
export function Navbar({
  onNewStory,
  onLoadStory,
  onSaveStory,
  onSaveStoryWithImages,
  onGenerateBundle,
  onCreateLinearStory,
  onAddSection,
  onRedraw,
  onShowVariables,
  onShowJson,
  onShowMetadata,
  onShowAISettings,
}: NavbarProps) {
  return (
    <BootstrapNavbar bg="light" expand="lg">
      <Container fluid>
        <BootstrapNavbar.Brand>Story Adventure Editor</BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <NavDropdown title="File" id="file-menu">
              <NavDropdown.Item onClick={onNewStory}>New Adventure</NavDropdown.Item>
              <NavDropdown.Item onClick={onLoadStory}>Load Adventure</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={onSaveStory}>
                Save Adventure as it is
              </NavDropdown.Item>
              <NavDropdown.Item onClick={onSaveStoryWithImages}>
                Save Adventure with all images in one file
              </NavDropdown.Item>
              <NavDropdown.Item onClick={onGenerateBundle}>
                Generate playable adventure bundle
              </NavDropdown.Item>
              <NavDropdown.Item onClick={onCreateLinearStory}>
                Create Linear Story
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={onShowJson}>
                Display Current Story JSON
              </NavDropdown.Item>
            </NavDropdown>
            <NavDropdown title="Edit" id="edit-menu">
              <NavDropdown.Item onClick={onShowMetadata}>Story Metadata</NavDropdown.Item>
              <NavDropdown.Item onClick={onShowAISettings}>AI Configuration</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={onAddSection}>Add Section</NavDropdown.Item>
            </NavDropdown>
            <NavDropdown title="Story Variables" id="variables-menu">
              <NavDropdown.Item onClick={onShowVariables}>Manage Variables</NavDropdown.Item>
            </NavDropdown>
            <Nav.Item>
              <Nav.Link onClick={onRedraw}>Redraw Graph</Nav.Link>
            </Nav.Item>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}
