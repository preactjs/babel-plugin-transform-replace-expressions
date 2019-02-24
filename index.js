const { parseExpression } = require("@babel/parser");

module.exports = function({ types: t }, replace = {}) {
  const replacements = Object.keys(replace).map(key => {
    const kExpr = parseExpression(key);
    const vExpr = parseExpression(replace[key]);
    return { key: kExpr, value: vExpr };
  });

  function sanitizedNode(node) {
    const { comments, loc, start, end, ...rest } = node;
    return rest;
  }

  function compareArrays(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((x, i) => compare(x, b[i]));
  }

  function compareObjects(a, b) {
    const aKeys = Object.keys(a);
    const bSet = new Set(Object.keys(b));
    if (aKeys.length !== bSet.size) {
      return false;
    }
    if (!aKeys.every(k => bSet.has(k))) {
      return false;
    }
    return aKeys.every((k, i) => compare(a[k], b[k]));
  }

  function compare(a, b) {
    if (typeof a !== typeof b) {
      return false;
    }
    if (Array.isArray(a)) {
      return Array.isArray(b) && compareArrays(a, b);
    }
    if (t.isNode(a)) {
      return t.isNode(b) && compareObjects(sanitizedNode(a), sanitizedNode(b));
    }
    if (typeof a === "object") {
      return compareObjects(a, b);
    }
    if (typeof a === "number") {
      return a === b || (isNaN(a) && isNaN(b));
    }
    return a === b;
  }

  const replacementNodes = new Set(replacements.map(r => r.value));
  return {
    name: "transform-replace-expressions",
    visitor: {
      Expression(path, state) {
        if (replacementNodes.has(path.node)) {
          path.skip();
          return;
        }
        for (const replacement of replacements) {
          if (compare(replacement.key, path.node)) {
            path.replaceWith(replacement.value);
            return;
          }
        }
      }
    }
  };
};
