const { parseExpression } = require("@babel/parser");

module.exports = function({ types: t }, options = {}) {
  const replace = options.replace || {};

  const types = new Map();
  const values = new Set();
  Object.keys(replace).forEach(key => {
    const kNode = parseExpression(key);
    const vNode = parseExpression(replace[key]);

    const candidates = types.get(kNode.type) || [];
    candidates.push({ key: kNode, value: vNode });
    types.set(kNode.type, candidates);

    values.add(vNode);
  });

  return {
    name: "transform-replace-expressions",
    visitor: {
      Expression(path) {
        if (values.has(path.node)) {
          path.skip();
          return;
        }

        const candidates = types.get(path.node.type);
        if (!candidates) {
          return;
        }

        for (const { key, value } of candidates) {
          if (t.isNodesEquivalent(key, path.node)) {
            try {
              t.validate(path.parent, path.key, value);
            } catch (err) {
              if (!(err instanceof TypeError)) {
                throw err;
              }
              path.skip();
              return;
            }

            path.replaceWith(value);
            return;
          }
        }
      }
    }
  };
};
