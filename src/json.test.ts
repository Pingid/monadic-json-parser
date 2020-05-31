import { parse, Parser } from "./monad";
import json, { int, token, string, list, keyValue, object } from "./json";

const result = <A, B>(x: ReturnType<Parser<A, B>>) => (x[0] ? x[0][0] : x);

test("integer", () => {
  expect(result(int("10"))).toEqual(10);
});

test("string", () => {
  expect(result(string('"fds"'))).toEqual("fds");
  expect(result(string('fsd"'))).toEqual([]);
});

test("list", () => {
  expect(result(parse(list(token(int)))("[]"))).toEqual([]);
  expect(result(parse(list(token(int)))("[1]"))).toEqual([1]);
  expect(result(parse(list(token(int)))("[1,2  ,  4  ]"))).toEqual([1, 2, 4]);
  expect(result(parse(list(token(string)))('[ "one" ]'))).toEqual(["one"]);
});

test("keyValue", () => {
  expect(result(parse(keyValue(string))('"cool": "beans"'))).toEqual({
    cool: "beans",
  });
});

test("object", () => {
  expect(result(parse(object(string))("{}"))).toEqual({});
  expect(
    result(parse(object(string))('{ "cool": "beans", "beans": "cool" }'))
  ).toEqual({ cool: "beans", beans: "cool" });
});

test("json", () => {
  expect(result(parse(json)("10"))).toEqual(10);
  expect(result(parse(json)('"one"'))).toEqual("one");
  expect(result(parse(json)("[10]"))).toEqual([10]);
  expect(result(parse(json)('["one"]'))).toEqual(["one"]);
  expect(result(parse(json)('{ "one": [1] }'))).toEqual({ one: [1] });
  expect(
    result(parse(json)('{ "one": { "two": [{ "three": ["four", "five"]}] } }'))
  ).toEqual({ one: { two: [{ three: ["four", "five"] }] } });

  const j = { one: { two: [1, 2, { four: [], five: {} }] } };
  expect(result(parse(json)(JSON.stringify(j, null, 2)))).toEqual(j);
});
