const parameterConfig = [
  {
    id: "tps",
    label: "Ticks Per Second",
    default: 40,
    type: "number",
    attrs: {
      min: 40,
      max: 100,
    },
  },
  {
    id: "drawRadius",
    label: "Circle Radius",
    tooltip: "Radius of the circles drawn",
    default: 5,
    type: "number",
    attrs: {
      min: 1,
      max: 25,
    },
  },
  {
    id: "bgColour",
    label: "Background Colour",
    type: "color",
    default: "000000",
  },
  {
    id: "particleColour",
    label: "Particle Colour",
    type: "color",
    default: "FFFFFF",
  },
  {
    id: "clearTiles",
    text: "Clear all tiles",
    type: "button",
  },
];
