class FallRight extends BaseRule {
  constructor() {
    super();
    this.filterWillFallRight = tf
      .tensor2d([
        [-1, -1, 0],
        [0.5, -1, 0],
        [0.5, -1, 0],
      ])
      .reshape([3, 3, 1, 1]);
    this.filterUnpopulate = tf
      .tensor2d([
        [0, 0, 0],
        [0, 0, 1],
        [0, 0, 0],
      ])
      .reshape([3, 3, 1, 1]);
    this.filterPopulate = tf
      .tensor2d([
        [0, 0, 0],
        [1, 0, 0],
        [0, 0, 0],
      ])
      .reshape([3, 3, 1, 1]);
  }

  convolve(state) {
    const willFallRightMask = state.tiles.data
      .notEqual(0)
      .cast(state.tiles.data.dtype)
      .conv2d(this.filterWillFallRight, 1, 1)
      .equal(1);

    return state.tiles.data
      .mul(
        willFallRightMask
          .conv2d(this.filterUnpopulate, 1, 1)
          .equal(0)
          .maximum(state.tiles.leftSideMask)
      )
      .add(
        willFallRightMask.mul(
          state.tiles.data.conv2d(this.filterPopulate, 1, 1)
        )
      );
  }
}
