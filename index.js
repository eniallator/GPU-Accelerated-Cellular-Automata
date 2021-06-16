const paramConfig = new ParamConfig(
  parameterConfig,
  window.location.search,
  $("#cfg-outer")
);

tf.setBackend("cpu");

const convolutions = [
  {
    // fall down
    filter: tf
      .tensor2d([
        [0, 1, 0],
        [0, 0.4, 0],
        [0, 0.6, 0],
      ])
      .reshape([3, 3, 1, 1]),
    convolve: function (tiles) {
      const floor = tiles.mul(sceneFloorMask);
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

let scene = tf.ones([100, 100, 1]);
const sceneFloor = new Array(scene.shape[0])
  .fill()
  .map(() => new Array(scene.shape[1]).fill([0]));
for (let i in sceneFloor[scene.shape[0] - 1]) {
  sceneFloor[scene.shape[0] - 1][i] = [1];
}
const sceneFloorMask = tf.tensor(sceneFloor);

scene = scene.mul(tf.randomUniform(scene.shape).greater(0.7));

function update() {
  for (let convolution of convolutions) {
    scene = convolution.convolve.call(convolution, scene);
  }
}

function run() {
  tf.browser.toPixels(scene, canvas);
  update();
  setTimeout(run, (1 / paramConfig.getVal("tps")) * 1000);
}

paramConfig.tellListeners(true);
run();
