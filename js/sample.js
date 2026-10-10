// The example text behind the Sample button (and the first playback).

export const SAMPLE = `// A tiny fizzbuzz, to hear what code sounds like
function fizzbuzz(limit = 30) {
  const out = [];
  for (let i = 1; i <= limit; i++) {
    if (i % 15 === 0) {
      out.push("FizzBuzz");
    } else if (i % 3 === 0) {
      out.push("Fizz");
    } else if (i % 5 === 0) {
      out.push("Buzz");
    } else {
      out.push(String(i));
    }
  }
  return out;
}

console.log(fizzbuzz().join(", "));
`;
