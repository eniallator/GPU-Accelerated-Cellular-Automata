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
const imgUrl = "./resized_yoda.jpg";

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

state.config.addListener((_, updates) => {
  colours = colourIds.map((id) => hexToRGB(state.config.getVal(id)));
}, colourIds);

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
let loadingInProgress = true;
const neighbourUpdates = new NeighourUpdates();

function run() {
  // update();
  // if (pixelData) pixelData.dispose();
  // pixelData = mapIdsToColours(state.tiles.data, colours);

  // console.log(tf.tiles);
  state.tiles.data = neighbourUpdates.tidiedConvolve(state);
  if (pixelData) pixelData.dispose();
  pixelData = state.tiles.data.sub(1);
  tf.browser.toPixels(pixelData, canvas);
  setTimeout(run, (1 / state.config.getVal("tps")) * 1000);
}

// state.tiles.generateRandomTiles(0.2, colourIds.length - 1);
state.tiles.data = tf.ones(state.tiles.data.shape);
state.config.tellListeners(true);

const img = document.querySelector("#loading-img");
img.src = imgUrl;
img.onload = (evt) => {
  const loadedImageCanvas = document.querySelector("#loading-canvas");
  loadedImageCanvas.width = canvas.width;
  loadedImageCanvas.height = canvas.height;

  const imageCtx = loadedImageCanvas.getContext("2d");
  imageCtx.drawImage(img, 0, 0, img.width, img.height);

  state.image = tf.tidy(() => {
    const rawImage = tf.browser.fromPixels(
      imageCtx.getImageData(0, 0, img.width, img.height),
      1
    );
    // const resizedImage = tf.image.resizeNearestNeighbor(
    //   rawImage,
    //   [state.tiles.data.shape[0], state.tiles.data.shape[1]],
    //   true
    // );
    const blackAndWhiteImage = rawImage.greaterEqual(110 / 2);
    const offsetImage = blackAndWhiteImage.add(1);

    return tf.keep(offsetImage);
  });
  if (loadingInProgress) {
    loadingInProgress = false;
  } else {
    run();
  }
};

if (loadingInProgress) {
  loadingInProgress = false;
} else {
  run();
}

/*
sand: down left, down right, down
water: left, down left, right, down right, down
wood: stuck
smoke: opposite of water

velocity?
*/
