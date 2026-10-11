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

def is_prime(n):
    if n < 2:
        return False
    for d in range(2, int(n ** 0.5) + 1):
        if n % d == 0:
            return False
    return True

# Which of the first twenty Fibonacci numbers are prime?
primes = [x for x in fib(20) if is_prime(x)]
print("prime Fibonacci numbers:", primes)
`;

const HOPE = `"Hope" is the thing with feathers -
That perches in the soul -
And sings the tune without the words -
And never stops - at all -

And sweetest - in the Gale - is heard -
And sore must be the storm -
That could abash the little Bird
That kept so many warm -

I've heard it in the chillest land -
And on the strangest Sea -
Yet - never - in Extremity,
It asked a crumb - of me.
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

Elizabeth's astonishment was beyond expression. She stared, coloured, doubted, and was silent. This he considered sufficient encouragement; and the avowal of all that he felt, and had long felt for her, immediately followed.
`;

const GRACE = `Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found,
Was blind, but now I see.

'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed.

Through many dangers, toils and snares,
I have already come;
'Tis grace hath brought me safe thus far,
And grace will lead me home.

The Lord has promised good to me,
His word my hope secures;
He will my shield and portion be,
As long as life endures.
`;

const AULD_LANG_SYNE = `Should auld acquaintance be forgot,
and never brought to mind?
Should auld acquaintance be forgot,
and auld lang syne?

For auld lang syne, my dear,
for auld lang syne,
we'll tak a cup o' kindness yet,
for auld lang syne.

And surely ye'll be your pint-stoup,
and surely I'll be mine!
And we'll tak a cup o' kindness yet,
for auld lang syne.

We twa hae run about the braes,
and pou'd the gowans fine;
But we've wander'd mony a weary fit,
sin' auld lang syne.
`;

const WANNABE = `Ha ha ha ha ha
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

const SLC_PUNK=`And so there I was. I was gonna go to Harvard. It was obvious. 
I was gonna be a lawyer and play in the God-damned system, and that was that. 
I was my old man. He knew, so what else could I do? 
I mean, there's no future in anarchy; I mean let's face it. 
But when I was into it, there was never a thought of the future. 
I mean we were certain the world was gonna end, but when it didn't, I had to do something, so fuck it. 
I could always be a litigator in New York and piss the shit out of the judges. 
I mean that was me: a trouble maker of the future. 
The guy that was one of those guys that my parents so arrogantly saved the world for, so we could fuck it up. 
We can do a hell of a lot more damage in the system than outside of it. 
That was the final irony, I think. That, and well, this. 
And \"fuck you\" for all of you who were thinking it: I guess when all was said and done, I was nothing more than a God-damned, trendy-ass poser.`

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
    { id: 'slcpunk', name: 'SLC Punk - Stevo\'s Monologue', text: SLC_PUNK},
  ] },
  { group: 'Songs', items: [
    { id: 'grace', name: 'Amazing Grace', text: GRACE },
    { id: 'auld', name: 'Auld Lang Syne', text: AULD_LANG_SYNE },
    { id: 'wannabe', name: 'Wannabe', text: WANNABE },
  ] },
];

export const SAMPLE = FIZZBUZZ;
