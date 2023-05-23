class Tiles {
  #data;
  #sides;
  #sideLength;

  constructor(sideLength) {
    this.#sideLength = sideLength;
    this.#data = tf.zeros([this.#sideLength, this.#sideLength, 1]);

    this.generateSides();
  }

  generateSides() {
    if (this.#sides) {
      Object.values(this.#sides).forEach((side) => side.dispose());
    }
    const top = new Array(this.#sideLength)
      .fill()
      .map(() => new Array(this.#sideLength).fill([0]));
    const bottom = new Array(this.#sideLength)
      .fill()
      .map(() => new Array(this.#sideLength).fill([0]));

    for (let i in top[0]) {
      top[0][i] = [1];
    }
    for (let i in bottom[this.#sideLength - 1]) {
      bottom[this.#sideLength - 1][i] = [1];
    }

    this.#sides = {
      top: tf.tensor(top, this.data.shape),
      bottom: tf.tensor(bottom, this.data.shape),
    };
    this.#sides.right = tf.tidy(() =>
      tf.keep(this.#sides.bottom.transpose().reshape(this.data.shape))
    );
    this.#sides.left = tf.tidy(() =>
      tf.keep(this.#sides.top.transpose().reshape(this.data.shape))
    );
  }

  generateRandomTiles(chanceForParticle, numParticles) {
    const shape = [this.#sideLength, this.#sideLength, 1];
    this.data = tf.tidy(() => {
      const noise = tf.randomUniform(shape);
      let data = tf.zeros(shape);
      for (let i = 0; i < numParticles; i++) {
        data = data.add(
          noise
            .greater(1 - (1 - i / numParticles) * chanceForParticle)
            .cast(data.dtype)
        );
      }
      return tf.keep(data);
    });
  }

  drawCircle(x, y, radius, particleId) {
    this.data = tf.tidy(() => {
      const xCoordsDst = tf
        .range(0, this.#sideLength)
        .tile([this.#sideLength])
        .reshape(this.#data.shape);
      const dataWithCircle = xCoordsDst
        .sub(x)
        .pow(2)
        .add(xCoordsDst.transpose().reshape(this.#data.shape).sub(y).pow(2))
        .less(radius ** 2)
        .cast(this.#data.dtype)
        .mul(particleId);
      return tf.keep(
        dataWithCircle.where(dataWithCircle.greater(0), this.#data)
      );
    });
  }

  clearData() {
    this.data = tf.zeros(this.#data.shape);
  }

  countTiles() {
    const counts = {};
    for (let val of this.#data.dataSync()) {
      if (counts[val] === undefined) counts[val] = 0;
      counts[val]++;
    }
    return counts;
  }

  set data(newData) {
    this.#data.dispose();
    this.#data = newData;
  }
  get data() {
    return this.#data;
  }

  get sideLength() {
    return this.#sideLength;
  }

  get topSideMask() {
    return this.#sides.top;
  }
  get bottomSideMask() {
    return this.#sides.bottom;
  }
  get rightSideMask() {
    return this.#sides.right;
  }
  get leftSideMask() {
    return this.#sides.left;
  }
}
