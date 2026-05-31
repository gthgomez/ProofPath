import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { ProblemDiagnostic, RunnerLanguage } from "@/domain/types";
import { colors, radius, semanticColors, spacing, toneColors } from "@/ui/theme";

interface SyntaxHighlightedEditorProps {
  accessibilityLabel: string;
  diagnostics?: ProblemDiagnostic[];
  focusLine?: number | null;
  language: RunnerLanguage;
  onChangeText: (value: string) => void;
  value: string;
}

interface Token {
  text: string;
  kind: TokenKind;
}

type TokenKind = "base" | "comment" | "keyword" | "literal" | "number" | "operator" | "string" | "function";

interface CompletionSuggestion {
  label: string;
  detail: string;
  insertText: string;
}

const pythonKeywords = new Set([
  "and", "as", "assert", "break", "class", "continue", "def", "elif", "else", "except", "finally", "for", "from", "if",
  "import", "in", "is", "lambda", "not", "or", "pass", "return", "try", "while", "with", "yield"
]);

const javaScriptKeywords = new Set([
  "as", "async", "await", "break", "case", "catch", "class", "const", "continue", "default", "else", "export", "extends",
  "finally", "for", "from", "function", "if", "import", "in", "interface", "let", "new", "of", "return", "switch", "throw",
  "try", "type", "while"
]);

const sqlKeywords = new Set([
  "alter", "and", "as", "by", "create", "delete", "desc", "distinct", "drop", "from", "group", "having", "insert", "into",
  "join", "left", "limit", "not", "null", "on", "or", "order", "right", "select", "set", "table", "update", "values",
  "where"
]);

const literals = new Set(["true", "false", "none", "null", "undefined", "True", "False", "None", "NULL"]);

export function SyntaxHighlightedEditor({
  accessibilityLabel,
  diagnostics = [],
  focusLine,
  language,
  onChangeText,
  value
}: SyntaxHighlightedEditorProps): ReactElement {
  const usesOverlayHighlight = Platform.OS === "web";
  const [selection, setSelection] = useState({ start: value.length, end: value.length });
  const selectionStart = selection.start;
  const code = value.length > 0 ? value : " ";
  const currentWord = getCurrentWord(value, selectionStart);
  const cursorPosition = getCursorPosition(value, selectionStart);
  const suggestions = useMemo(
    () => getCompletionSuggestions(language, currentWord).slice(0, 4),
    [currentWord, language]
  );
  const diagnosticLines = useMemo(() => new Set(diagnostics
    .filter((diagnostic) => diagnostic.confidence === "known" && typeof diagnostic.line === "number")
    .map((diagnostic) => diagnostic.line as number)), [diagnostics]);

  useEffect(() => {
    if (!focusLine || focusLine < 1) {
      return;
    }

    const start = offsetForLine(value, focusLine);
    setSelection({ start, end: start });
  }, [focusLine, value]);

  const insertSuggestion = (suggestion: CompletionSuggestion): void => {
    const word = getCurrentWord(value, selectionStart);
    const start = Math.max(0, selectionStart - word.length);
    const nextValue = `${value.slice(0, start)}${suggestion.insertText}${value.slice(selectionStart)}`;
    onChangeText(nextValue);
    setSelection({ start: start + suggestion.insertText.length, end: start + suggestion.insertText.length });
  };

  const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>): void => {
    if (event.nativeEvent.key !== "Tab" || suggestions.length === 0) {
      return;
    }

    const maybePreventableEvent = event as unknown as { preventDefault?: () => void };
    maybePreventableEvent.preventDefault?.();
    insertSuggestion(suggestions[0]);
  };

  return (
    <View style={styles.editorShell}>
      <View style={styles.editorHeader}>
        <Text style={styles.editorTitle}>Code editor</Text>
        <View style={styles.editorHeaderMeta}>
          <Text style={styles.cursorReadout}>{formatCursorReadout(cursorPosition, selection)}</Text>
          <Text style={styles.editorLanguage}>{runtimeLabel(language)}</Text>
        </View>
      </View>
      <View style={styles.syntaxLegend}>
        <LegendItem color={tokenStyles.keyword.color} label="keywords" />
        <LegendItem color={tokenStyles.string.color} label="text" />
        <LegendItem color={tokenStyles.number.color} label="numbers" />
        <LegendItem color={tokenStyles.comment.color} label="comments" />
      </View>
      <View style={styles.editorBody}>
        {usesOverlayHighlight ? (
          <Text
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.highlightLayer}
          >
            {highlightCode(code, language).map((line, lineIndex) => (
              <Text key={`line-${lineIndex}`}>
                <Text
                  style={[
                    styles.lineMarker,
                    diagnosticLines.has(lineIndex + 1) ? styles.lineMarkerProblem : null,
                    cursorPosition.lineIndex === lineIndex ? styles.lineMarkerActive : null
                  ]}
                >
                  {cursorPosition.lineIndex === lineIndex ? ">" : diagnosticLines.has(lineIndex + 1) ? "!" : " "}
                </Text>
                <Text style={[styles.lineNumber, cursorPosition.lineIndex === lineIndex ? styles.lineNumberActive : null]}>
                  {String(lineIndex + 1).padStart(2, " ")}
                </Text>
                <Text style={styles.lineSpacer}>  </Text>
                {line.map((token, tokenIndex) => (
                  <Text key={`token-${lineIndex}-${tokenIndex}`} style={tokenStyles[token.kind]}>
                    {token.text}
                  </Text>
                ))}
                {lineIndex < code.split("\n").length - 1 ? "\n" : null}
              </Text>
            ))}
          </Text>
        ) : null}
        <TextInput
          accessibilityHint="Type code here. Syntax colors behind the editor separate keywords, strings, numbers, and comments."
          accessibilityLabel={accessibilityLabel}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          onChangeText={onChangeText}
          onKeyPress={handleKeyPress}
          onSelectionChange={(event) => {
            setSelection(event.nativeEvent.selection);
          }}
          scrollEnabled={false}
          selection={selection}
          selectionColor={colors.blue}
          spellCheck={false}
          style={[
            styles.editorInput,
            usesOverlayHighlight ? styles.editorInputOverlay : styles.editorInputPlain
          ]}
          textAlignVertical="top"
          value={value}
        />
      </View>
      <View style={styles.completionBar}>
        <View style={styles.completionHeader}>
          <Text style={styles.completionTitle}>Suggestions</Text>
          <Text style={styles.completionHint}>Press Tab or tap to complete</Text>
        </View>
        <View style={styles.completionList}>
          {suggestions.length > 0 ? suggestions.map((suggestion) => (
            <Pressable
              accessibilityHint={`Inserts ${suggestion.label} into the editor.`}
              accessibilityLabel={`Autocomplete ${suggestion.label}`}
              key={`${suggestion.label}-${suggestion.insertText}`}
              onPress={() => insertSuggestion(suggestion)}
              style={styles.completionChip}
            >
              <Text style={styles.completionLabel}>{suggestion.label}</Text>
              <Text style={styles.completionDetail}>{suggestion.detail}</Text>
            </Pressable>
          )) : (
            <Text style={styles.noCompletionText}>Type a keyword prefix such as pri, for, if, sel, const, or func.</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }): ReactElement {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function runtimeLabel(language: RunnerLanguage): string {
  if (language === "python") {
    return "Python runtime";
  }

  if (language === "sql") {
    return "SQL engine";
  }

  if (language === "typescript") {
    return "TypeScript transform runtime";
  }

  return "JavaScript runtime";
}

function getCurrentWord(value: string, cursor: number): string {
  const prefix = value.slice(0, cursor);
  const match = prefix.match(/[A-Za-z_][A-Za-z0-9_]*$/);
  return match?.[0] ?? "";
}

function getCursorPosition(value: string, cursor: number): { column: number; line: number; lineIndex: number } {
  const prefix = value.slice(0, cursor);
  const lines = prefix.split("\n");
  const lineIndex = lines.length - 1;
  return {
    column: lines[lineIndex].length + 1,
    line: lineIndex + 1,
    lineIndex
  };
}

function offsetForLine(value: string, line: number): number {
  if (line <= 1) {
    return 0;
  }

  const lines = value.split("\n");
  return lines.slice(0, Math.min(line - 1, lines.length)).reduce((offset, currentLine) => offset + currentLine.length + 1, 0);
}

function formatCursorReadout(
  cursorPosition: { column: number; line: number },
  selection: { start: number; end: number }
): string {
  const selectedCharacters = Math.abs(selection.end - selection.start);
  if (selectedCharacters > 0) {
    return `${selectedCharacters} selected`;
  }

  return `Ln ${cursorPosition.line}, Col ${cursorPosition.column}`;
}

function getCompletionSuggestions(language: RunnerLanguage, currentWord: string): CompletionSuggestion[] {
  const normalizedWord = currentWord.toLowerCase();
  const suggestions = completionCatalogFor(language);

  if (!normalizedWord) {
    return suggestions.slice(0, 4);
  }

  return suggestions.filter((suggestion) => (
    suggestion.label.toLowerCase().startsWith(normalizedWord) ||
    suggestion.insertText.toLowerCase().startsWith(normalizedWord)
  ));
}

function completionCatalogFor(language: RunnerLanguage): CompletionSuggestion[] {
  if (language === "python") {
    return [
      { label: "print()", detail: "send output to the terminal", insertText: "print()" },
      { label: "for", detail: "repeat once per item", insertText: "for item in items:" },
      { label: "if", detail: "run code only when a condition is true", insertText: "if condition:" },
      { label: "else", detail: "fallback branch", insertText: "else:" },
      { label: "def", detail: "define a reusable function", insertText: "def function_name():" },
      { label: "return", detail: "send a value back from a function", insertText: "return " },
      { label: "import", detail: "load a module", insertText: "import " },
      { label: "True", detail: "boolean true value", insertText: "True" },
      { label: "False", detail: "boolean false value", insertText: "False" },
      { label: "None", detail: "no value", insertText: "None" }
    ];
  }

  if (language === "sql") {
    return [
      { label: "SELECT", detail: "choose columns to read", insertText: "SELECT " },
      { label: "FROM", detail: "choose the table", insertText: "FROM " },
      { label: "WHERE", detail: "filter rows", insertText: "WHERE " },
      { label: "GROUP BY", detail: "group rows before summarizing", insertText: "GROUP BY " },
      { label: "ORDER BY", detail: "sort rows", insertText: "ORDER BY " },
      { label: "LIMIT", detail: "cap returned rows", insertText: "LIMIT " },
      { label: "COUNT(*)", detail: "count rows", insertText: "COUNT(*)" }
    ];
  }

  return [
    { label: "const", detail: "declare a value that will not be reassigned", insertText: "const " },
    { label: "let", detail: "declare a value that can change", insertText: "let " },
    { label: "function", detail: "define reusable behavior", insertText: "function functionName() {" },
    { label: "return", detail: "send a value back from a function", insertText: "return " },
    { label: "if", detail: "run code only when a condition is true", insertText: "if (condition) {" },
    { label: "else", detail: "fallback branch", insertText: "else {" },
    { label: "console.log()", detail: "send output to the terminal", insertText: "console.log()" },
    { label: "type", detail: "name a TypeScript object shape", insertText: "type Name = {" },
    { label: "interface", detail: "declare a TypeScript object contract", insertText: "interface Name {" }
  ];
}

function highlightCode(code: string, language: RunnerLanguage): Token[][] {
  return code.split("\n").map((line) => tokenizeLine(line, language));
}

function tokenizeLine(line: string, language: RunnerLanguage): Token[] {
  const commentStart = findCommentStart(line, language);
  const codePart = commentStart >= 0 ? line.slice(0, commentStart) : line;
  const commentPart = commentStart >= 0 ? line.slice(commentStart) : "";
  const tokens = tokenizeCodePart(codePart, language);

  if (commentPart) {
    tokens.push({ text: commentPart, kind: "comment" });
  }

  return tokens.length > 0 ? tokens : [{ text: " ", kind: "base" }];
}

function findCommentStart(line: string, language: RunnerLanguage): number {
  const marker = language === "sql" ? "--" : "#";
  const slashMarker = language === "javascript" || language === "typescript" ? "//" : "";
  let quote: string | null = null;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const previous = line[index - 1];

    if ((char === "\"" || char === "'" || char === "`") && previous !== "\\") {
      quote = quote === char ? null : quote ?? char;
    }

    if (!quote && line.startsWith(marker, index)) {
      return index;
    }

    if (!quote && slashMarker && line.startsWith(slashMarker, index)) {
      return index;
    }
  }

  return -1;
}

function tokenizeCodePart(code: string, language: RunnerLanguage): Token[] {
  const tokens: Token[] = [];
  const pattern = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|[+\-*/%=<>!&|:.,()[\]{}]+)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > cursor) {
      tokens.push({ text: code.slice(cursor, match.index), kind: "base" });
    }

    tokens.push(classifyToken(match[0], code, match.index, language));
    cursor = match.index + match[0].length;
  }

  if (cursor < code.length) {
    tokens.push({ text: code.slice(cursor), kind: "base" });
  }

  return tokens;
}

function classifyToken(token: string, code: string, index: number, language: RunnerLanguage): Token {
  if (/^["'`]/.test(token)) {
    return { text: token, kind: "string" };
  }

  if (/^\d/.test(token)) {
    return { text: token, kind: "number" };
  }

  if (/^[+\-*/%=<>!&|:.,()[\]{}]+$/.test(token)) {
    return { text: token, kind: "operator" };
  }

  if (literals.has(token)) {
    return { text: token, kind: "literal" };
  }

  if (keywordSetFor(language).has(token) || keywordSetFor(language).has(token.toLowerCase())) {
    return { text: token, kind: "keyword" };
  }

  const afterToken = code.slice(index + token.length);
  if (/^\s*\(/.test(afterToken)) {
    return { text: token, kind: "function" };
  }

  return { text: token, kind: "base" };
}

function keywordSetFor(language: RunnerLanguage): Set<string> {
  if (language === "python") {
    return pythonKeywords;
  }

  if (language === "sql") {
    return sqlKeywords;
  }

  return javaScriptKeywords;
}

const codeFont = {
  fontFamily: "monospace",
  fontSize: 14,
  letterSpacing: 0,
  lineHeight: 20
};

const tokenStyles = StyleSheet.create({
  base: {
    color: colors.text
  },
  comment: {
    color: colors.mutedStrong,
    fontStyle: "italic"
  },
  function: {
    color: toneColors.teal.strong,
    fontWeight: "800"
  },
  keyword: {
    color: semanticColors.lessonPrimary,
    fontWeight: "800"
  },
  literal: {
    color: semanticColors.success,
    fontWeight: "800"
  },
  number: {
    color: semanticColors.missionPrimary,
    fontWeight: "800"
  },
  operator: {
    color: colors.mutedStrong
  },
  string: {
    color: semanticColors.successStrong
  }
});

const styles = StyleSheet.create({
  editorShell: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden"
  },
  completionBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  completionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  completionTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  completionHint: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0,
    textAlign: "right"
  },
  completionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  completionChip: {
    backgroundColor: toneColors.blue.bg,
    borderColor: toneColors.blue.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: 2,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  completionLabel: {
    color: toneColors.blue.strong,
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0
  },
  completionDetail: {
    color: colors.mutedStrong,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0
  },
  noCompletionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0
  },
  editorHeader: {
    alignItems: "center",
    backgroundColor: colors.ink,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  editorHeaderMeta: {
    alignItems: "flex-end",
    flexShrink: 1,
    gap: 2
  },
  editorTitle: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0
  },
  editorLanguage: {
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  cursorReadout: {
    color: colors.tealMuted,
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0
  },
  syntaxLegend: {
    backgroundColor: colors.inkSoft,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  legendDot: {
    borderRadius: 999,
    height: 8,
    width: 8
  },
  legendText: {
    color: colors.mutedStrong,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0
  },
  editorBody: {
    backgroundColor: colors.surfaceMuted,
    minHeight: 260,
    position: "relative"
  },
  highlightLayer: {
    ...codeFont,
    minHeight: 260,
    padding: spacing.md
  },
  lineNumber: {
    color: colors.muted,
    ...codeFont
  },
  lineNumberActive: {
    color: semanticColors.lessonPrimary,
    fontWeight: "900"
  },
  lineMarker: {
    ...codeFont,
    color: colors.muted,
    fontWeight: "900"
  },
  lineMarkerActive: {
    color: semanticColors.lessonPrimary
  },
  lineMarkerProblem: {
    color: semanticColors.danger
  },
  lineSpacer: {
    ...codeFont,
    color: colors.muted
  },
  editorInput: {
    ...codeFont,
    backgroundColor: "transparent",
    minHeight: 260,
    paddingBottom: spacing.md,
    paddingRight: spacing.md,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  },
  editorInputOverlay: {
    ...StyleSheet.absoluteFillObject,
    color: "transparent",
    paddingLeft: spacing.md + 44
  },
  editorInputPlain: {
    color: colors.text,
    paddingLeft: spacing.md
  }
});
