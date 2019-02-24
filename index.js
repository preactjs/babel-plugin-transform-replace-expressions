const { parseExpression } = require("@babel/parser");

module.exports = function({ types: t }, replace = {}) {
  const replacements = Object.keys(replace).map(key => {
    const kExpr = parseExpression(key);
    const vExpr = parseExpression(replace[key]);
    return { key: kExpr, value: vExpr };
  });

  const replacementNodes = new Set(replacements.map(r => r.value));
  return {
    name: "transform-replace-expressions",
    visitor: {
      Expression(path) {
        if (replacementNodes.has(path.node)) {
          path.skip();
          return;
        }

        for (const replacement of replacements) {
          if (t.isNodesEquivalent(replacement.key, path.node)) {
            try {
              t.validate(path.parent, path.key, replacement.value);
            } catch (err) {
              if (!(err instanceof TypeError)) {
                throw err;
              }
              return;
            }

            path.replaceWith(replacement.value);
            return;
          }
        }
      }
    }
  };
};
