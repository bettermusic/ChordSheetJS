export default class CloneableStub {
  value: any;

  constructor(value) {
    this.value = value;
  }

  clone() {
    return new CloneableStub(this.value);
  }
}
