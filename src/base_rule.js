class BaseRule {
  convolve() {
    throw Error(
      `Class ${this.__proto__.constructor.name} has not implemented the convolve method!`
    );
  }

  tidiedConvolve(...args) {
    return tf.tidy(() => tf.keep(this.convolve(...args)));
  }
}
