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

const WANNA_BE = `Ha ha ha ha ha
Yo, I'll tell you what I want, what I really, really want
So tell me what you want, what you really, really want
I'll tell you what I want, what I really, really want
So tell me what you want, what you really, really want
I wanna, (ha) I wanna, (ha) I wanna, (ha) I wanna, (ha)
I wanna really, really, really wanna zigazig ah
If you want my future, forget my past
If you wanna get with me, better make it fast
Now don't go wasting my precious time
Get your act together we could be just fine
I'll tell you what I want, what I really, really want
So tell me what you want, what you really, really want
I wanna, (ha) I wanna, (ha) I wanna, (ha) I wanna, (ha)
I wanna really, really, really wanna zigazig ah
If you wanna be my lover, you gotta get with my friends
(Gotta get with my friends)
Make it last forever, friendship never ends
If you wanna be my lover, you have got to give
Taking is too easy, but that's the way it is
Oh, what do you think about that?
Now you know how I feel
Say you can handle my love, are you for real?
(Are you for real?)
I won't be hasty, I'll give you a try
If you really bug me then I'll say goodbye
Yo, I'll tell you what I want, what I really, really want
So tell me what you want, what you really, really want
I wanna, (ha) I wanna, (ha) I wanna, (ha) I wanna, (ha)
I wanna really, really, really wanna zigazig ah
If you wanna be my lover, you gotta get with my friends
(Gotta get with my friends)
Make it last forever, friendship never ends
If you wanna be my lover, you have got to give
(You've got to give)
Taking is too easy, but that's the way it is
So, here's a story from A to Z
You wanna get with me, you gotta listen carefully
We got Em in the place who likes it in your face
You got G like MC who likes it on a
Easy V doesn't come for free, she's a real lady
And as for me, ha you'll see
Slam your body down and wind it all around
Slam your body down and wind it all around
If you wanna be my lover, you gotta get with my friends
(Gotta get with my friends)
Make it last forever, friendship never ends
If you wanna be my lover, you have got to give
(You've got to give)
Taking is too easy, but that's the way it is
If you wanna be my lover
You gotta, you gotta, you gotta, you gotta, you gotta
Slam, slam, slam, slam (make it last forever)
Slam your body down and wind it all around
Slam your body down and wind it all around
Ha, ha, ha, ha, ha
Slam your body down and wind it all around
Slam your body down and zigazig ah
If you wanna be my lover`

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
    { id: 'auld', name: 'Wanna Be', text: WANNA_BE },
  ] },
];

export const SAMPLE = FIZZBUZZ;
