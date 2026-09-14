import { describe, expect, it } from "vitest";
import type { LessonRunnerSpec, RunnerLanguage } from "@/domain/types";
import { validateSandboxSubmission } from "@/sandbox/policy";

function specFor(language: RunnerLanguage): LessonRunnerSpec {
  return {
    language,
    instructions: "Run the learner submission.",
    starterCode: "",
    visibleTests: [],
    hiddenTests: [],
    expectedOutput: [],
    timeoutMs: 1000,
    allowNetwork: false
  };
}

function rulesTriggered(language: RunnerLanguage, code: string): string[] {
  return validateSandboxSubmission(specFor(language), code).map((violation) => violation.rule);
}

describe("sandbox policy keyword matching", () => {
  describe("python-network requires import or attribute context", () => {
    it.each([
      "requirements = ['pandas>=2.0', 'requests==2.31.0']",
      "packages = ('flask', 'requests')",
      "summary = 'socket programming basics'",
      "notes = ['urllib is a standard library module']"
    ])("allows bare module names in data literals: %s", (code) => {
      expect(rulesTriggered("python", code)).not.toContain("python-network");
    });

    it.each([
      "import requests",
      "import socket",
      "import urllib.request",
      "from urllib import request",
      "from requests import get",
      "from socket import socket",
      "requests.get('https://example.com')",
      "socket.socket()",
      "urllib.request.urlopen('https://example.com')",
      "import http.client",
      "http.client.HTTPSConnection('example.com')"
    ])("blocks real network usage: %s", (code) => {
      expect(rulesTriggered("python", code)).toContain("python-network");
    });

    it("does not weaken the other python rules", () => {
      expect(rulesTriggered("python", "import subprocess")).toContain("python-process");
      expect(rulesTriggered("python", "import micropip")).toContain("python-package-install");
      expect(rulesTriggered("python", "eval('1 + 1')")).toContain("python-dynamic-code");
      expect(rulesTriggered("python", "open('data.txt')")).toContain("python-file-io");
      expect(rulesTriggered("python", "while True:\n    pass")).toContain("python-infinite-loop");
    });
  });

  describe("sql keywords ignore comments and string literals", () => {
    it("allows a mutation keyword inside a line comment", () => {
      expect(rulesTriggered("sql", "SELECT 1; -- replace this row later")).toEqual([]);
    });

    it("allows multiple mutation keywords inside a line comment", () => {
      expect(rulesTriggered("sql", "-- update delete drop alter insert\nSELECT 1;")).toEqual([]);
    });

    it("allows mutation keywords inside a block comment", () => {
      expect(rulesTriggered("sql", "SELECT 1 /* DROP TABLE t; UPDATE t SET x=1 */;")).toEqual([]);
    });

    it("allows a mutation keyword inside a string literal", () => {
      expect(rulesTriggered("sql", "SELECT 'drop' AS note;")).toEqual([]);
    });

    it("allows a mutation phrase inside a string literal", () => {
      expect(rulesTriggered("sql", "SELECT 'drop table t' AS note;")).toEqual([]);
    });

    it("handles escaped single quotes inside a string literal", () => {
      expect(rulesTriggered("sql", "SELECT 'it''s a delete' AS note;")).toEqual([]);
    });

    it("allows attach and extension keywords inside comments and strings", () => {
      expect(rulesTriggered("sql", "-- attach database 'x' as y\nSELECT 'load_extension';")).toEqual([]);
    });

    it.each([
      ["INSERT INTO t VALUES (1)", "sql-mutation"],
      ["DROP TABLE t", "sql-mutation"],
      ["UPDATE t SET x=1", "sql-mutation"],
      ["DELETE FROM t", "sql-mutation"],
      ["ALTER TABLE t ADD COLUMN y", "sql-mutation"],
      ["REPLACE INTO t VALUES (1)", "sql-mutation"],
      ["VACUUM", "sql-mutation"],
      ["PRAGMA table_info(t)", "sql-mutation"],
      ["ATTACH DATABASE 'x' AS y", "sql-attach"],
      ["DETACH DATABASE y", "sql-attach"],
      ["SELECT load_extension('evil')", "sql-extension"],
      ["CREATE VIRTUAL TABLE t USING fts5(x)", "sql-extension"]
    ])("blocks a real statement: %s", (code, rule) => {
      expect(rulesTriggered("sql", code)).toContain(rule);
    });

    it("still blocks a write statement whose value contains a string keyword", () => {
      expect(rulesTriggered("sql", "UPDATE t SET note = 'drop the mic'")).toContain("sql-mutation");
    });
  });
});
