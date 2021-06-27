class SwapVertical extends BaseRule {
  constructor() {
    super();
    this.filterWillSwap = tf
      .tensor2d([
        [0, 0, 0],
        [0, 0, 0],
        [0, 1, 0],
      ])
      .reshape([3, 3, 1, 1]);
    this.filterNoise = tf
      .tensor2d([
        [0, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
      ])
      .reshape([3, 3, 1, 1]);
    this.filterAddSwapDiff = tf
      .tensor2d([
        [0, -1, 0],
        [0, 1, 0],
        [0, 0, 0],
      ])
      .reshape([3, 3, 1, 1]);
  }

  convolve(state) {
    const willSwapMask = state.tiles.data
      .equal(1)
      .cast(state.tiles.data.dtype)
      .where(
        state.tiles.data.conv2d(this.filterWillSwap, 1, 1).equal(2),
        tf.zeros(state.tiles.data.shape)
      )
      .mul(
        state.noise
          .conv2d(this.filterNoise, 1, 1)
          .greater(1 - 2 * state.config.getVal("swapChance"))
      );

    return state.tiles.data.add(
      willSwapMask.conv2d(this.filterAddSwapDiff, 1, 1)
    );
  }
}
