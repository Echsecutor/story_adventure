/**
 * Menu screen component displayed when no story is loaded.
 */

import { Button, Container, Row, Col } from 'react-bootstrap';

interface MenuScreenProps {
  onLoadFile: () => void;
}

export function MenuScreen({ onLoadFile }: MenuScreenProps) {
  return (
    <Container id="menu_container" style={{ position: 'relative', top: '25vh' }}>
      <Row>
        <Col>
          <h1>Story Adventure Viewer</h1>
          <p>
            This is the viewer of{' '}
            <a
              href="https://github.com/Echsecutor/story_adventure"
              target="_blank"
              rel="noreferrer"
            >
              the open source story adventure tools
            </a>
            . See there for copyright, license information and please{' '}
            <a
              href="https://github.com/Echsecutor/story_adventure/issues"
              target="_blank"
              rel="noreferrer"
            >
              open issues
            </a>{' '}
            to report bugs or request features.
          </p>
        </Col>
      </Row>
      <Row>
        <Col>
          <Button type="button" variant="success" onClick={onLoadFile}>
            Load a Story Adventure
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>Press &quot;?&quot; to display the viewer help.</Col>
      </Row>
    </Container>
  );
}
