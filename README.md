# Story Adventure Tools

This is a minimalist framework for writing / playing through (non-linear) stories.

## Introduction

Have a look at the [example story](stories/example_story.json).

A **Story Adventure** is primarily a set of **Sections** together with a **State** representing the current (initially the starting) state.
The **State** can also hold variables that you can set initially (e.g. for consistent naming of entities) or change during the game.

**Sections** links to each other via **Choices** in the `.next` array of each section. Sections without choices are terminal.
Sections can also contain **Media**, with a type (image/video) and the link to the src. This can also be embedded as a data link.
Embedding Media has the advantage of creating an all-in-one file, but the obvious disadvantage of creating large files with inefficient encoding of binary data.

**Choices** may contain a description which is then actually displayed as a choice when playing through the adventure.
If you leave the description empty, it is just a "next" type button to break long sections into readable chunks/change grafics. You likely do not want to do this if there is more then one choice.

## Editor

Using [the editor](./editor/) you can write your own story adventures by providing text and media for each section and linking the sections by choices.
This is a proof of concept implementation, feel free to contribute a better ui!

- Files never leave your computer, the editor is pure JS running in your browser
- 👉️ Try online at: https://echsecutor.github.io/story_adventure/editor  👈️

## Viewer

Using [the viewer](./viewer/) you can play thtough any story adventure. This is a proof of concept implementation, feel free to contribute a better ui!

- 👉️ Try online at: https://echsecutor.github.io/story_adventure/viewer  👈️


## Acknowledgment

We proudly acknowledge using the following open source components in this project:

- [Cytoscape.js](https://github.com/cytoscape/cytoscape.js) for drawing the graph view of the story
- [Bootstrap 5](https://github.com/twbs/bootstrap) for UI components
- [marked](https://github.com/markedjs/marked) for Markdown rendering
- [DOMPurify](https://github.com/cure53/DOMPurify) for HTML sanitization

See there for the corresponding licenses.

## License

Copyright 2024 Sebastian Schmittner

<a href="https://www.gnu.org/licenses/agpl-3.0.html">
<img alt="AGPLV3" style="border-width:0" src="https://www.gnu.org/graphics/agplv3-with-text-162x68.png" /><br />
</a>

All code published in this repository is free software: you can redistribute it and/or modify it under the terms of the
GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

For the included open source projects, different licenses might be applicable. See the respective projects pages listed above for details.
</a>
