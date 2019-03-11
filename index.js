const { parseExpression } = require("@babel/parser");

module.exports = function({ types: t }, options = {}) {
  const replace = options.replace || {};
  const allowConflictingReplacements = !!options.allowConflictingReplacements;

  const types = new Map();
  const values = new Set();
  Object.keys(replace).forEach(key => {
    const kNode = parseExpression(key);
    const vNode = parseExpression(replace[key]);

    const candidates = types.get(kNode.type) || [];
    candidates.push({ key: kNode, value: vNode, originalKey: key });
    types.set(kNode.type, candidates);

    values.add(vNode);
  });

  if (!allowConflictingReplacements) {
    for (const candidates of types.values()) {
      for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          if (t.isNodesEquivalent(candidates[i].key, candidates[j].key)) {
            throw new Error(
              `Expressions ${JSON.stringify(
                candidates[i].originalKey
              )} and ${JSON.stringify(candidates[j].originalKey)} conflict`
            );
          }
        }
      }
    }
  }

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
