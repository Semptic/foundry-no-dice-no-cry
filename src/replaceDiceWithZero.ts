export function replaceDiceWithZero(): void {
  const patch = () => {
    const Roll = (window as any).Roll;
    if (!Roll || (Roll.prototype as any)._noDiceNoCryPatched) {
      return;
    }
    const proto = Roll.prototype as any;

    // Patch individual die rolls so hooks like Dice So Nice receive zeroed results
    const diceTypes = (window as any).CONFIG?.Dice?.types;
    Object.values(diceTypes || {}).forEach((Die: any) => {
      const dProto = Die?.prototype;
      if (!dProto || dProto._noDiceNoCryPatched) {
        return;
      }
      dProto._noDiceNoCryOriginalRoll = dProto.roll;
      dProto.roll = function (...rollArgs: any[]): any {
        const roll = dProto._noDiceNoCryOriginalRoll.apply(this, rollArgs);
        if (roll && typeof roll.result === "number") {
          roll.result = 0;
        }
        return roll;
      };
      dProto._noDiceNoCryPatched = true;
    });

    proto._noDiceNoCryOriginalEvaluate = proto._evaluate;
    proto._evaluate = async function (...args: any[]): Promise<any> {
      await proto._noDiceNoCryOriginalEvaluate.apply(this, args);
      this.terms?.forEach((t: any) => {
        if (Array.isArray(t.results)) {
          t.results.forEach((r: any) => {
            r.result = 0;
          });
          if (typeof t.total === "number") {
            t.total = 0;
          }
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
  const diceTypes = (window as any).CONFIG?.Dice?.types;
  if (diceTypes) {
    Object.values(diceTypes).forEach((Die: any) => {
      const dProto = Die?.prototype;
      if (!dProto?._noDiceNoCryPatched) {
        return;
      }
      if (dProto._noDiceNoCryOriginalRoll) {
        dProto.roll = dProto._noDiceNoCryOriginalRoll;
        delete dProto._noDiceNoCryOriginalRoll;
      }
      delete dProto._noDiceNoCryPatched;
    });
  }

  if (!Roll || !proto?._noDiceNoCryPatched) {
    return;
  }
  if (proto._noDiceNoCryOriginalEvaluate) {
    proto._evaluate = proto._noDiceNoCryOriginalEvaluate;
    delete proto._noDiceNoCryOriginalEvaluate;
  }
  delete proto._noDiceNoCryPatched;
}
