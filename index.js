tf.setBackend("webgl");

const state = {
  config: new ParamConfig(
    parameterConfig,
    window.location.search,
    $("#cfg-outer")
  ),
  tiles: new Tiles(300),
};
state.noise = tf.randomUniform(state.tiles.data.shape);

const rules = [
  new FallLeft(),
  new FallRight(),
  new FallDown(),
  new SwapVertical(),
];

new ClipboardJS("#share-btn", {
  text: (trigger) => {
    return (
      location.protocol +
      "//" +
      location.host +
      location.pathname +
      "?" +
      state.config.serialiseToURLParams()
    );
  },
}).on("success", (evt) => alert("Copied share link to clipboard"));

const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");

const mouse = {
  down: false,
  pos: { x: 0, y: 0 },
};
const mouseToTileCoords = (x, y) => [
  Math.floor((x / $("#canvas").width()) * state.tiles.sideLength),
  Math.floor((y / $("#canvas").height()) * state.tiles.sideLength),
];
canvas.onmousemove = (ev) => {
  [mouse.pos.x, mouse.pos.y] = mouseToTileCoords(ev.clientX, ev.clientY);
};
canvas.ontouchmove = (ev) => {
  [mouse.pos.x, mouse.pos.y] = mouseToTileCoords(
    ev.touches[0].clientX,
    ev.touches[0].clientY
  );
};
canvas.onmousedown = canvas.ontouchstart = (ev) => {
  mouse.down = true;
  if (!isNaN(ev.clientX) && !isNaN(ev.clientY)) {
    [mouse.pos.x, mouse.pos.y] = mouseToTileCoords(ev.clientX, ev.clientY);
  }
};
canvas.onmouseup = canvas.ontouchend = () => {
  mouse.down = false;
};

function hexToRGB(hex) {
  const match = hex
    .toUpperCase()
    .match(/^#?([\dA-F]{2})([\dA-F]{2})([\dA-F]{2})$/);
  if (!match) return false;
  return [
    parseInt(match[1], 16),
    parseInt(match[2], 16),
    parseInt(match[3], 16),
  ];
}

const colourIds = ["bgColour", "sandColour", "waterColour"];
let colours;

state.config.addListener(
  (_, updates) => {
    colours = colourIds.map((id) => hexToRGB(state.config.getVal(id)));
  },
  ["bgColour", "particleColour"]
);

function mapIdsToColours(tiles, cols) {
  return tf.tidy(() => {
    let pixelData = tf.zeros([...tiles.shape.slice(0, -1), cols[0].length]);
    for (let i = 0; i < cols.length; i++) {
      pixelData = pixelData.add(
        tiles.equal(i).mul(cols[i].map((channel) => channel / 255))
      );
    }
    return tf.keep(pixelData);
  });
}

function update() {
  if (state.config.clicked("clearTiles")) {
    state.tiles.clearData();
    return;
  }

  state.noise.dispose();
  state.noise = tf.randomUniform(state.tiles.data.shape);

  if (mouse.down) {
    state.tiles.drawCircle(
      mouse.pos.x,
      mouse.pos.y,
      state.config.getVal("drawRadius"),
      state.config.getVal("selectedTile")
    );
  }

  rules.forEach((rule) => (state.tiles.data = rule.tidiedConvolve(state)));
}

let pixelData;

function run() {
  update();
  if (pixelData) pixelData.dispose();
  pixelData = mapIdsToColours(state.tiles.data, colours);
  tf.browser.toPixels(pixelData, canvas);
  setTimeout(run, (1 / state.config.getVal("tps")) * 1000);
}

state.tiles.generateRandomTiles(0.2, colourIds.length - 1);
state.config.tellListeners(true);
run();

/*
sand: down left, down right, down
water: left, down left, right, down right, down
wood: stuck
smoke: opposite of water

velocity?
*/
