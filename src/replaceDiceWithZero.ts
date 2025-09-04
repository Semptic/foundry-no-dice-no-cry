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

    // Force rolls to be blind and reveal them after any dice animation
    proto._noDiceNoCryOriginalToMessage = proto.toMessage;
    proto.toMessage = async function (
      messageData: any,
      options: any = {},
    ): Promise<any> {
      const msg = await proto._noDiceNoCryOriginalToMessage.call(
        this,
        messageData,
        { ...options, rollMode: "blindroll" },
      );
      if (msg?.blind) {
        const reveal = () => msg.update({ blind: false, whisper: [] });
        const hooks = (window as any).Hooks;
        if ((window as any).game?.dice3d && hooks?.once) {
          hooks.once("diceSoNiceRollComplete", reveal);
          // Fallback in case the hook never fires
          setTimeout(reveal, 2000);
        } else {
          // Allow the message to render before revealing
          setTimeout(reveal, 100);
        }
      }
      return msg;
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
  if (proto._noDiceNoCryOriginalToMessage) {
    proto.toMessage = proto._noDiceNoCryOriginalToMessage;
    delete proto._noDiceNoCryOriginalToMessage;
  }
  delete proto._noDiceNoCryPatched;
}
