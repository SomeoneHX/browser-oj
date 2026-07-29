export class Stream {
  constructor() {
    this._writable = true
  }
  write(chunk) {
    return true
  }
  end() {}
  on() {}
  emit() {}
}

export function Stream_on() {}
