# Story Adventure

This is a minimalist framework for writing / playing through (non-linear) stories.

## Inductive Introduction

Let's introduce the basic idea by a few examples.

A **Story Adventure** is primarily a set of **Sections** together with a **State** representing the current (initially the starting) state:

```json
{
    "state":
    {
        "current_section": "1",
        "variables":
        {
            "hunted_by": "a huge dragon"
        }
    },
    "sections":
    [
        {
            "id": "1",
            "text_lines":[
                 "# The Beginning",
                 "",
                "This is the beginning of your Adventure!",
                "",
                "You woke up by the side of a path running through a forest.",
                "The weather is quite nice and pretty warm already, although it is still early morning.",
                "You can not remember where you are exactly or why you slept by the side of the path with all your clothes on, but judging from your headache this might be related to drinking a little ","to much yesterday...? Anyway, you probably want to start moving and at least find yourself some water to fight the fire that seems to be roaring in your throat....",
                "The path is roughly oriented in a east-west direction. Since you have no clue which way you came, do you want to...",
                ""
            ]
            "next":
            [
                {
                    "text": "turn east! Towards the rising sun!",
                    "next": "2"
                },
                {
                    "text": "turn west! Your head was pointing in this direction when you woke up, so you where probably walking in this direction. Maybe.",
                    "next": "3"
                }
            ]
        },
        {
            "id": "2",
            "text_lines":[
                 "Collecting yourself from the ground you start walking east, the pockets of your jacket and trousers for clues where you came from or what happened.",
                "Just as your fingers touch the first thing that might be interesting, you freeze in mid step as the path takes a slight turn and you suddenly find yourself face to face with",
                "${hunted_by}.",
                "It seems like the beast was hunting you. A memory of running through these woods flashes past you. Right. You where lying by the road because you stumbled when running away from this ",
                "beast. You try to pick up where you left, turn around an pick that running back up, but way to late. The dragon is much quicker to recover from the surprise of seeing you and catches up to you with a huge jump, just to bite your head off."
            ]
        },
        {
            "id": "3",
            "text_lines":[
                 "Collecting yourself from the ground you start walking east, the pockets of your jacket and trousers for clues where you came from or what happened.",
                "As your fingers touch a smooth and cold object, a feeling of unease overcomes you. Maybe you did not just walk this forest drunk... it feels more like you where running away from something... You touch your aching head to find a huge bump right at your forehead. Maybe you stumbled and fell and injured your head in the process... Might explain another few bruises and scratches that you start noticing on your body."
            ]
            "next":
            [
                {
                    "text": "Maybe it would be a good idea to hide in the rather thick bushes by the side of the path?",
                    "next": "4"
                },
                {
                    "text": "It feels like you might want to pick up the pace. What ever you where running away from might still be after you!",
                    "next": "5"
                }
            ]
        },
        {
            "id": "4",
            "text_file": {
                "path": "path/to/hiding.md",
                "type": "text/markdown"
            }
        }
    ]
}
```

## Acknowledgment 

We proudly use the following open source components in this project

- [Cytoscape.js](https://github.com/cytoscape/cytoscape.js) for drawing the graph view of the story
- [Bootstrap 5](https://github.com/twbs/bootstrap) for the editor UI


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


