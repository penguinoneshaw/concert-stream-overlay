import { Observable } from "rxjs";

export const gamepadButton$ = new Observable<GamepadButton>((subscriber) => {
  let stopped = false;
  const pollGamepad = () => {
    // Always call `navigator.getGamepads()` inside of
    // the game loop, not outside.
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads.filter((v) => v)) {
      // Disregard empty slots.
      if (!gamepad) {
        continue;
      }

      const filtered = gamepad.buttons.filter((v) => v.pressed);

      for (const v of filtered) {
        subscriber.next(v);
      }
    }

    !stopped && window.requestAnimationFrame(pollGamepad);
  };

  pollGamepad();
  return () => (stopped = true);
});
