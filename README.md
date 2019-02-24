# babel-plugin-transform-replace-expressions [![CircleCI](https://circleci.com/gh/jviide/babel-plugin-transform-replace-expressions.svg?style=shield)](https://circleci.com/gh/jviide/babel-plugin-transform-replace-expressions)

Replace JavaScript expressions with other expressions.

## Installation

```
$ yarn add --dev babel-plugin-transform-replace-expressions
```

## Example

Input file:

```js
const env = process.env.NODE_ENV;

typeof Hello === "number";
```

`.babelrc`:

```json
{
  "plugins": [
    [
      "babel-plugin-transform-replace-expressions",
      {
        "replace": {
          "process.env.NODE_ENV": "\"production\"",
          "typeof Hello": "42"
        }
      }
    ]
  ]
}
```

Output:

```js
const env = "production";

42 === "number";
```

## Notes

 * Replacement only works for expressions - full expressions. You can't replacing *just* `env` in `process.env.NODE_ENV`, you have to replace `process.env`, which is a proper expression in Babel AST.
 * Replacement is only done when the result is valid JavaScript. For example replacing `a` with `2` in the following code:
 ```js
 a = 1;
 b = a;
 ```
 yields
 ```js
 a = 1;
 b = 2;
 ```

## License

This plugin is licensed under the MIT license. See [LICENSE](./LICENSE).
