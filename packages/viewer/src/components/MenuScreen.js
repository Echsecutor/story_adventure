import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Menu screen component displayed when no story is loaded.
 */
import { Button, Container, Row, Col } from 'react-bootstrap';
export function MenuScreen({ onLoadFile }) {
    return (_jsxs(Container, { id: "menu_container", style: { position: 'relative', top: '25vh' }, children: [_jsx(Row, { children: _jsxs(Col, { children: [_jsx("h1", { children: "Story Adventure Viewer" }), _jsxs("p", { children: ["This is the viewer of", ' ', _jsx("a", { href: "https://github.com/Echsecutor/story_adventure", target: "_blank", rel: "noreferrer", children: "the open source story adventure tools" }), ". See there for copyright, license information and please", ' ', _jsx("a", { href: "https://github.com/Echsecutor/story_adventure/issues", target: "_blank", rel: "noreferrer", children: "open issues" }), ' ', "to report bugs or request features."] })] }) }), _jsx(Row, { children: _jsx(Col, { children: _jsx(Button, { type: "button", variant: "success", onClick: onLoadFile, children: "Load a Story Adventure" }) }) }), _jsx(Row, { children: _jsx(Col, { children: "Press \"?\" to display the viewer help." }) })] }));
}
