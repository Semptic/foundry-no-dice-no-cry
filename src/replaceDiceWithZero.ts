export function replaceDiceWithZero(): void {
  const patch = () => {
    const Roll = (window as any).Roll;
    if (!Roll || (Roll.prototype as any)._noDiceNoCryPatched) {
      return;
    }
    const proto = Roll.prototype as any;
    proto._noDiceNoCryOriginalEvaluate = proto._evaluate;
    proto._evaluate = async function (...args: any[]): Promise<any> {
      await proto._noDiceNoCryOriginalEvaluate.apply(this, args);
      this.terms?.forEach((t: any) => {
        if (Array.isArray(t.results)) {
          t.results.forEach((r: any) => (r.result = 0));
        }
      });
      this._total = 0;
      this._result = "0";
      return this;
    };
    proto._noDiceNoCryPatched = true;
  };

  if ((window as any).game?.ready) {
    patch();
  } else {
    (window as any).Hooks?.once?.("ready", patch);
  }
}

export function restoreDice(): void {
  const Roll = (window as any).Roll;
  const proto = Roll?.prototype as any;
  if (!Roll || !proto?._noDiceNoCryPatched) {
    return;
  }
  if (proto._noDiceNoCryOriginalEvaluate) {
    proto._evaluate = proto._noDiceNoCryOriginalEvaluate;
    delete proto._noDiceNoCryOriginalEvaluate;
  }
  delete proto._noDiceNoCryPatched;
}
