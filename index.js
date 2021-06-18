const paramConfig = new ParamConfig(
  parameterConfig,
  window.location.search,
  $("#cfg-outer")
);

tf.setBackend("webgl");

const convolutions = [
  {
    // Fall left
    filterUnpopulate: tf
      .tensor2d([
        [-1, -1, 0],
        [-1, 0.5, 0],
        [-1, 0.5, 0],
      ])
      .reshape([3, 3, 1, 1]),
    filterPopulate: tf
      .tensor2d([
        [0, -1, -1],
        [0, -1, 0.5],
        [0, -1, 0.5],
      ])
      .reshape([3, 3, 1, 1]),
    convolve: function (tiles) {
      const unpopulated = tiles
        .conv2d(this.filterUnpopulate, 1, 1)
        .equal(1)
        .logicalNot()
        .where(sceneSideMasks.left.logicalNot(), tiles);
      const populated = tiles.conv2d(this.filterPopulate, 1, 1).equal(1);
      return tiles.minimum(unpopulated).maximum(populated);
    },
  },
  {
    // Fall right
    filterUnpopulate: tf
      .tensor2d([
        [0, -1, -1],
        [0, 0.5, -1],
        [0, 0.5, -1],
      ])
      .reshape([3, 3, 1, 1]),
    filterPopulate: tf
      .tensor2d([
        [-1, -1, 0],
        [0.5, -1, 0],
        [0.5, -1, 0],
      ])
      .reshape([3, 3, 1, 1]),
    convolve: function (tiles) {
      const unpopulated = tiles
        .conv2d(this.filterUnpopulate, 1, 1)
        .equal(1)
        .logicalNot()
        .where(sceneSideMasks.right.logicalNot(), tiles);
      const populated = tiles.conv2d(this.filterPopulate, 1, 1).equal(1);
      return tiles.minimum(unpopulated).maximum(populated);
    },
  },
  {
    // Fall down
    filter: tf
      .tensor2d([
        [0, 1, 0],
        [0, 0.4, 0],
        [0, 0.6, 0],
      ])
      .reshape([3, 3, 1, 1]),
    convolve: function (tiles) {
      const floor = tiles.mul(sceneSides.bottom);
      const convolved = tiles.conv2d(this.filter, 1, "same");
      const mask = convolved.notEqual(1.4);
      return convolved.mul(mask).minimum(1).floor().maximum(floor);
    },
  },
];

new ClipboardJS("#share-btn", {
  text: (trigger) => {
    return (
      location.protocol +
      "//" +
      location.host +
      location.pathname +
      "?" +
      paramConfig.serialiseToURLParams()
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
  Math.floor((x / $("#canvas").width()) * scene.shape[1]),
  Math.floor((y / $("#canvas").height()) * scene.shape[0]),
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
    .toLowerCase()
    .match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/);
  if (!match) return false;
  return [
    parseInt(match[1], 16),
    parseInt(match[2], 16),
    parseInt(match[3], 16),
  ];
}

const colourIds = ["bgColour", "particleColour"];
let colours;

paramConfig.addListener(
  (state, updates) => {
    colours = colourIds.map((id) => hexToRGB(paramConfig.getVal(id)));
  },
  ["bgColour", "particleColour"]
);

const sceneSideLength = 300;
let scene = tf.tidy(() =>
  tf.keep(tf.randomUniform([sceneSideLength, sceneSideLength, 1]).greater(0.8))
);
const newSceneArray = (n = 0) =>
  new Array(scene.shape[0])
    .fill()
    .map(() => new Array(scene.shape[1]).fill([n]));

const sceneSides = {
  bottom: newSceneArray(),
  top: newSceneArray(),
};

for (let i in sceneSides.bottom[scene.shape[0] - 1]) {
  sceneSides.bottom[scene.shape[0] - 1][i] = [1];
}
for (let i in sceneSides.top[0]) {
  sceneSides.top[0][i] = [1];
}
sceneSides.bottom = tf.tensor(sceneSides.bottom, scene.shape);
sceneSides.top = tf.tensor(sceneSides.top, scene.shape);
sceneSides.right = sceneSides.bottom.transpose().reshape(scene.shape);
sceneSides.left = sceneSides.top.transpose().reshape(scene.shape);

const sceneSideMasks = {};
for (let key of Object.keys(sceneSides)) {
  sceneSideMasks[key] = sceneSides[key].cast("bool");
}

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

function drawCircle() {
  const newScene = tf.tidy(() => {
    const xCoordsDst = tf
      .range(0, sceneSideLength)
      .tile([sceneSideLength])
      .reshape(scene.shape);
    const sceneWithCircle = xCoordsDst
      .sub(mouse.pos.x)
      .pow(2)
      .add(xCoordsDst.transpose().reshape(scene.shape).sub(mouse.pos.y).pow(2))
      .less(paramConfig.getVal("drawRadius") ** 2)
      .cast(scene.dtype);
    return tf.keep(sceneWithCircle.where(sceneWithCircle.greater(0), scene));
  });
  scene.dispose();
  scene = newScene;
}

function update() {
  if (paramConfig.clicked("clearTiles")) {
    clearTiles();
    return;
  }
  if (mouse.down) {
    drawCircle();
  }
  for (let convolution of convolutions) {
    const newScene = tf.tidy(() =>
      tf.keep(convolution.convolve.call(convolution, scene))
    );
    scene.dispose();
    scene = newScene;
  }
}

let pixelData;

function run() {
  update();
  if (pixelData) pixelData.dispose();
  pixelData = mapIdsToColours(scene, colours);
  tf.browser.toPixels(pixelData, canvas);
  setTimeout(run, (1 / paramConfig.getVal("tps")) * 1000);
}

function clearTiles() {
  const newScene = tf.zeros(scene.shape);
  scene.dispose();
  scene = newScene;
}

function countTiles() {
  let count = 0;
  for (let val of scene.dataSync()) {
    count += val;
  }
  return count;
}

paramConfig.tellListeners(true);
run();
