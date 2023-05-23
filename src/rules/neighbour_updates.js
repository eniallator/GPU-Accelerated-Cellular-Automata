class NeighourUpdates extends BaseRule {
  constructor() {
    super();
    this.filterNeighbours = tf
      .tensor2d([
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0],
      ])
      .reshape([3, 3, 1, 1]);
    this.filterCenter = tf
      .tensor2d([
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ])
      .reshape([3, 3, 1, 1]);
    this.numNeighbours = this.filterNeighbours.sum();
  }

  convolve(state) {
    const edgeMask = state.tiles.data
      .conv2d(this.filterNeighbours, 1, 1)
      .mod(this.numNeighbours)
      .notEqual(0);
    return state.image.where(edgeMask, state.tiles.data);
  }
}
