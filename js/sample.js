// The example texts behind the Examples menu. SAMPLE (the first one) is also what the page opens with.
// Everything here is either written for rad.io or in the public domain (an old poem, a 19th-century novel and traditional songs); modern song
// lyrics are still under copyright, so they aren't included. `code: false` texts are shown without syntax colouring.

const FIZZBUZZ = `// A tiny fizzbuzz, to hear what code sounds like
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

const FIBONACCI = `# Fibonacci numbers, in Python
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

for i, x in enumerate(fib(12)):
    print(f"fib({i}) = {x}")
`;

const HOPE = `"Hope" is the thing with feathers -
That perches in the soul -
And sings the tune without the words -
And never stops - at all -

And sweetest - in the Gale - is heard -
And sore must be the storm -
That could abash the little Bird
That kept so many warm -
`;

const CLOTHS = `Had I the heavens' embroidered cloths,
Enwrought with golden and silver light,
The blue and the dim and the dark cloths
Of night and light and the half-light,
I would spread the cloths under your feet:
But I, being poor, have only my dreams;
I have spread my dreams under your feet;
Tread softly because you tread on my dreams.
`;

const DARCY = `In vain have I struggled. It will not do. My feelings will not be repressed. You must allow me to tell you how ardently I admire and love you.
`;

const GRACE = `Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found,
Was blind, but now I see.
`;

const AULD_LANG_SYNE = `Should auld acquaintance be forgot,
and never brought to mind?
Should auld acquaintance be forgot,
and auld lang syne?

For auld lang syne, my dear,
for auld lang syne,
we'll tak a cup o' kindness yet,
for auld lang syne.
`;

export const EXAMPLES = [
  { group: 'Code', items: [
    { id: 'fizzbuzz', name: 'FizzBuzz (JavaScript)', text: FIZZBUZZ, code: true },
    { id: 'fib', name: 'Fibonacci (Python)', text: FIBONACCI, code: true },
  ] },
  { group: 'Poetry', items: [
    { id: 'hope', name: '“Hope” is the thing with feathers – Dickinson', text: HOPE },
    { id: 'cloths', name: 'Aedh Wishes for the Cloths of Heaven – Yeats', text: CLOTHS },
  ] },
  { group: 'Prose', items: [
    { id: 'darcy', name: 'Mr. Darcy\'s proposal – Pride and Prejudice', text: DARCY },
  ] },
  { group: 'Songs (public domain)', items: [
    { id: 'grace', name: 'Amazing Grace', text: GRACE },
    { id: 'auld', name: 'Auld Lang Syne', text: AULD_LANG_SYNE },
  ] },
];

export const SAMPLE = FIZZBUZZ;
