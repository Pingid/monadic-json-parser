import { Applicative2 } from "fp-ts/lib/Applicative";
import { Alternative2 } from "fp-ts/lib/Alternative";
import { Functor2 } from "fp-ts/lib/Functor";
import { Monad2 } from "fp-ts/lib/Monad";
import { Alt2 } from "fp-ts/lib/Alt";

import { tuple } from "fp-ts/lib/function";

export const URI = "Parser";
export type URI = typeof URI;

declare module "fp-ts/lib/HKT" {
  interface URItoKind2<E, A> {
    readonly Parser: Parser<E, A>;
  }
}

export type Parser<I, O> = (input: I) => [O, I][];
export const parse = <I, O>(p: Parser<I, O>): Parser<I, O> => (i: I) => p(i);

const functor: Functor2<URI> = {
  URI,
  map: (p, fn) => parse((x) => parse(p)(x).map(([h, t]) => tuple(fn(h), t))),
};

const applicative: Applicative2<URI> = {
  ...functor,
  of: (a) => parse((x) => [[a, x]]),
  ap: (pg, px) =>
    parse((x) =>
      parse(pg)(x).reduce(
        (a, [h, t]) => [...a, ...functor.map(px, h)(t)],
        [] as ReturnType<Parser<any, any>>
      )
    ),
};

const monad: Monad2<URI> = {
  ...applicative,
  chain: (fa, f) =>
    parse((x) =>
      fa(x).reduce(
        (a, [v, out]) => [...a, ...f(v)(out)],
        [] as ReturnType<ReturnType<typeof f>>
      )
    ),
};

const alt1: Alt2<URI> = {
  ...applicative,
  alt: (fx, fy) =>
    parse((x) => {
      const result = fx(x);
      if (result.length === 0) return fy()(x);
      return result;
    }),
};

const alternative: Alternative2<URI> = {
  ...applicative,
  ...alt1,
  zero: () => parse(() => []),
};

const P = {
  ...monad,
  ...alternative,
};

export default P;
