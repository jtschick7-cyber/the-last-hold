// Balance simulator entry point (technical design §13). A stub until v0.1
// (plan T0.2): it accepts the usual flags and exits 0 so `npm run check` and CI
// can call it from day one.
const args = process.argv.slice(2);
console.log(
  `simulator: no policies or checks yet (v0.0 stub). Args: ${args.join(' ') || '(none)'}`,
);
