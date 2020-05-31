import P, { parse, Parser } from "./monad";
import { tuple } from "fp-ts/lib/function";

// Charactor checks
const strIs = (fn: (x: string) => boolean) => fn;
const isDigit = strIs((x) => /^[0-9]*$/gim.test(x));
const isSpacing = strIs((x) => /\n|\s|\t/.test(x));

// Consume the next charactor
const item = parse((x: string) =>
  x.length > 0 ? [tuple(x[0], x.slice(1))] : []
);

// Consume the next charactor if it aggrees with the passed function
const sat = (fn: (x: string) => boolean) =>
  P.chain(item, (x: string) =>
    fn(x) ? P.of<string, string>(x) : P.zero<string, string>()
  );

// Consume a charactor equal to the charactor passed in
const char = (x: string) => sat((y) => y === x);
const notChar = (x: string) => sat((y) => y !== x);

// Consume as many charactors that aggree with the predicate and fail with empty string
const many = (x: Parser<string, string>): Parser<string, string> =>
  P.alt(some(x), () => P.of(""));

// Consume as many charactors that aggree with the predicate
const some = (x: Parser<string, string>): Parser<string, string> =>
  P.alt(
    P.chain(x, (y) => P.map(many(x), (z) => y + z)),
    () => P.zero()
  );

// Natural nummber parser
const nats = some(sat(isDigit));

// Integer parser
export const int = P.alt(
  P.chain(char("-"), () => P.map(nats, (y) => parseInt("-" + y))),
  () => P.map(nats, parseInt)
);

// Ignore spaces
const space = P.map(many(sat(isSpacing)), () => []);

// Ignore space around some parser
export const token = <A extends any>(x: Parser<string, A>) =>
  P.chain(space, () => P.chain(x, (y) => P.chain(space, () => P.of(y))));

// Parse strings
export const string = P.chain(char('"'), () =>
  P.chain(some(notChar('"')), (res) => P.chain(char('"'), () => P.of(res)))
);

// Parse a list of parsers
export const listItems = <T extends any>(
  x: Parser<string, T>,
  divider: Parser<string, any>
): Parser<string, T[]> =>
  P.chain(x, (y) =>
    P.alt(
      P.chain(divider, () =>
        P.chain(listItems(x, divider), (z) => P.of([y, ...z]))
      ),
      () => P.of([y])
    )
  );

// Parse JSON list
export const list = <T extends any>(x: Parser<string, T>) =>
  P.chain(char("["), () =>
    P.chain(
      P.alt(listItems(x, token(char(","))), () => P.of([])),
      (items) => P.chain(token(char("]")), () => P.of(items))
    )
  );

// Parse key value pair in json object
export const keyValue = <T extends any>(x: Parser<string, T>) =>
  P.chain(string, (key) =>
    P.chain(token(char(":")), () =>
      P.chain(x, (value) => P.of({ [key]: value }))
    )
  );

// Parse json object
export const object = <T extends any>(x: Parser<string, T>) =>
  P.chain(token(char("{")), () =>
    P.chain(
      P.alt<string, {}[]>(listItems(keyValue(x), token(char(","))), () =>
        P.of([{}])
      ),
      (ls) =>
        P.chain(token(char("}")), () =>
          P.of(ls.reduce((a, b) => ({ ...a, ...b }), {}))
        )
    )
  );

// Parser json
const json: Parser<string, any> = P.alt<string, any>(token(int), () =>
  P.alt<string, any>(token(string), () => P.alt(list(json), () => object(json)))
);

export default json;
