export function replaceDiceWithZero(): void {
  const patch = () => {
    const Roll = (window as any).Roll;
    if (!Roll || (Roll.prototype as any)._noDiceNoCryPatched) {
      return;
    }
    const original = Roll.prototype._evaluate;
    Roll.prototype._evaluate = async function (...args: any[]): Promise<any> {
      await original.apply(this, args);
      this.terms?.forEach((t: any) => {
        if (Array.isArray(t.results)) {
          t.results.forEach((r: any) => (r.result = 0));
        }
      });
      this._total = 0;
      this._result = "0";
      return this;
    };
    (Roll.prototype as any)._noDiceNoCryPatched = true;
  };

  if ((window as any).game?.ready) {
    patch();
  } else {
    (window as any).Hooks?.once?.("ready", patch);
  }
}
