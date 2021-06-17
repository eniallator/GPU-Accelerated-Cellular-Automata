const paramConfig = new ParamConfig(
  parameterConfig,
  window.location.search,
  $("#cfg-outer")
);

tf.setBackend("cpu");

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
        .where(sceneSideMasks.right.logicalNot(), tf.ones(scene.shape));
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
ctx.fillStyle = "black";
ctx.strokeStyle = "white";

let scene = tf.randomUniform([100, 100, 1]).greater(0.7);

const sceneSides = {
  bottom: new Array(scene.shape[0])
    .fill()
    .map(() => new Array(scene.shape[1]).fill([0])),
  top: new Array(scene.shape[0])
    .fill()
    .map(() => new Array(scene.shape[1]).fill([0])),
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

function update() {
  for (let convolution of convolutions) {
    scene = convolution.convolve.call(convolution, scene);
  }
}

function run() {
  update();
  tf.browser.toPixels(scene, canvas);
  setTimeout(run, (1 / paramConfig.getVal("tps")) * 1000);
}

function countTiles() {
  let count = 0;
  for (let val of scene.dataSync()) {
    count += val;
  }
  return count;
}

console.log(countTiles());
paramConfig.tellListeners(true);
run();
