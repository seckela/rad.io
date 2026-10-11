// The example texts behind the Examples menu. SAMPLE (the first one) is also what the page opens with.
// Everything here is either written for rad.io or in the public domain (old poems, prose and traditional songs); modern song
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

const SONNET_18 = `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date;
Sometime too hot the eye of heaven shines,
And often is his gold complexion dimm'd;
And every fair from fair sometime declines,
By chance or nature's changing course untrimm'd;
But thy eternal summer shall not fade,
Nor lose possession of that fair thou ow'st;
Nor shall death brag thou wander'st in his shade,
When in eternal lines to time thou grow'st:
So long as men can breathe or eyes can see,
So long lives this, and this gives life to thee.
`;

const RAVEN = `Once upon a midnight dreary, while I pondered, weak and weary,
Over many a quaint and curious volume of forgotten lore—
While I nodded, nearly napping, suddenly there came a tapping,
As of some one gently rapping, rapping at my chamber door.
"'Tis some visitor," I muttered, "tapping at my chamber door—
Only this and nothing more."
`;

const TYGER = `Tyger Tyger, burning bright,
In the forests of the night;
What immortal hand or eye,
Could frame thy fearful symmetry?

In what distant deeps or skies.
Burnt the fire of thine eyes?
On what wings dare he aspire?
What the hand, dare seize the fire?
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

const MOBY_DICK = `Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation.
`;

const DECLARATION = `We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.
`;

const PRIDE = `It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.

However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.
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
    { id: 'sonnet18', name: 'Sonnet 18 – Shakespeare', text: SONNET_18 },
    { id: 'raven', name: 'The Raven (opening) – Poe', text: RAVEN },
    { id: 'tyger', name: 'The Tyger – Blake', text: TYGER },
    { id: 'hope', name: '“Hope” is the thing with feathers – Dickinson', text: HOPE },
  ] },
  { group: 'Prose', items: [
    { id: 'moby', name: 'Moby-Dick (opening) – Melville', text: MOBY_DICK },
    { id: 'pride', name: 'Pride and Prejudice (opening) – Austen', text: PRIDE },
    { id: 'declaration', name: 'Declaration of Independence (preamble)', text: DECLARATION },
  ] },
  { group: 'Songs (public domain)', items: [
    { id: 'grace', name: 'Amazing Grace', text: GRACE },
    { id: 'auld', name: 'Auld Lang Syne', text: AULD_LANG_SYNE },
  ] },
];

export const SAMPLE = FIZZBUZZ;
