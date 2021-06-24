const parameterConfig = [
  {
    id: "tps",
    label: "Ticks Per Second",
    type: "number",
    default: 40,
    attrs: {
      min: 40,
      max: 100,
    },
  },
  {
    id: "bgColour",
    label: "Background Colour",
    type: "color",
    default: "04C6F6",
  },
  {
    id: "sandColour",
    label: "Sand Colour",
    type: "color",
    default: "E6A433",
  },
  {
    id: "waterColour",
    label: "Water Colour",
    type: "color",
    default: "0000FF",
  },
  {
    id: "swapChance",
    label: "Float Chance",
    tooltip: "Chance for water to float above sand",
    type: "range",
    default: 0.5,
    attrs: {
      min: 0,
      max: 1,
      step: 0.05,
    },
  },
  {
    id: "drawRadius",
    label: "Circle Radius",
    tooltip: "Radius of the circles drawn",
    type: "number",
    default: 5,
    attrs: {
      min: 1,
      max: 25,
    },
  },
  {
    id: "selectedTile",
    label: "Selected Tile to draw",
    tooltip: "1 = sand, 2 = water",
    type: "number",
    default: 1,
    attrs: {
      min: 1,
      max: 2,
    },
  },
  {
    id: "clearTiles",
    text: "Clear all tiles",
    type: "button",
  },
];
