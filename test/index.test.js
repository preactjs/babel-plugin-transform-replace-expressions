import t from "@babel/types";
import { transform } from "@babel/core";
import { parse } from "@babel/parser";
import { describe, it, expect } from "vitest";
import plugin from "../index.js";

function replace(input, options = {}) {
  return transform(input, {
    babelrc: false,
    configFile: false,
    plugins: [[plugin, options]],
  }).code;
}

function compare(input, output, options = {}) {
  const transformed = replace(input, options);

  if (!t.isNodesEquivalent(parse(transformed), parse(output))) {
    expect(transformed).to.equal(output);
  }
}

describe("babel-plugin-transform-replace-expressions", () => {
  it("accepts replacements as objects", () => {
    compare("a + b", "1 + 2", {
      replace: {
        a: "1",
        b: "2",
      },
    });
  });

  it("accepts replacements as an array of key-value pairs", () => {
    compare("a + b", "1 + 2", {
      replace: [
        ["a", "1"],
        ["b", "2"],
      ],
    });
  });

  it("replaces simple expressions", () => {
    compare("a", "true", {
      replace: {
        a: "true",
      },
    });
  });

  it("replaces all instances of matching expressions", () => {
    compare("a; a; a;", "true; true; true;", {
      replace: {
        a: "true",
      },
    });
  });

  it("replaces member expressions", () => {
    compare(
      'if (process.env.NODE_ENV === "production") {}',
      'if ("production" === "production") {}',
      {
        replace: {
          "process.env.NODE_ENV": '"production"',
        },
      }
    );
  });

  it("replaces partial member expressions", () => {
    compare("process.env.NODE_ENV", "({}).NODE_ENV", {
      replace: {
        "process.env": "{}",
      },
    });
  });

  it("replaces member expressions only beginning fron their root", () => {
    compare("process.env.NODE_ENV", "process.env.NODE_ENV", {
      replace: {
        env: `{}`,
      },
    });
  });

  it("replaces the longest match regardless of order", () => {
    compare("process.env.NODE_ENV", '"production"', {
      replace: {
        "process.env.NODE_ENV": '"production"',
        "process.env": "{}",
      },
    });
    compare("process.env.NODE_ENV", '"production"', {
      replace: {
        "process.env": "{}",
        "process.env.NODE_ENV": '"production"',
      },
    });
  });

  it("won't recurse", () => {
    compare("x", "y", {
      replace: {
        x: "y",
        y: "z",
      },
    });
  });

  it("skips replacements where the result is not valid JavaScript", () => {
    compare("a = 2", "a = 2", {
      replace: {
        a: "2",
      },
    });
  });

  it("skips replacements when there's a suitable smaller replacement", () => {
    compare("a.b = 2", "a.b = 2", {
      replace: {
        a: "x",
        "a.b": "2",
      },
    });
  });

  it("ignores non-expressions", () => {
    compare("const A = true; if (A) {}", "const A = true; if (B) {}", {
      replace: {
        A: "B",
      },
    });
  });

  it("disallows conflicting replacements (by default)", () => {
    expect(() =>
      replace("", {
        replace: {
          A: "B",
          "(A)": "B",
        },
      })
    ).throws(/Expressions .* and .* conflict/);
  });

  it("allows conflicting replacements when allowConflictingReplacements is truthy", () => {
    compare("A", "B", {
      replace: {
        A: "B",
        "(A)": "B",
      },
      allowConflictingReplacements: true,
    });
  });

  it("uses the last matching replacement on conflict", () => {
    compare("A", "C", {
      replace: [
        ["A", "B"],
        ["(A)", "C"],
      ],
      allowConflictingReplacements: true,
    });
    compare("A", "B", {
      replace: [
        ["(A)", "C"],
        ["A", "B"],
      ],
      allowConflictingReplacements: true,
    });
  });

  it("requires replacements keys to be expressions", () => {
    expect(() =>
      replace("", {
        replace: {
          "const x": "a",
        },
      })
    ).throws(TypeError);
  });

  it("requires replacements values to be expressions", () => {
    expect(() =>
      replace("", {
        replace: {
          a: "const x",
        },
      })
    ).throws(TypeError);
  });
});
