export type ConceptCategory =
  | "computer"
  | "terminal"
  | "python"
  | "debugging"
  | "testing"
  | "files"
  | "cli"
  | "project"
  | "typing"
  | "data"
  | "api"
  | "ops"
  | "git"
  | "evidence";

export interface ConceptDefinition {
  id: string;
  label: string;
  category: ConceptCategory;
  description: string;
  introducedLevel: number;
  aliases?: string[];
  parentId?: string;
}

export const conceptRegistry: ConceptDefinition[] = [
  // Level 0: Computer, Files, Terminal, Script
  {
    id: "tool.files.file",
    label: "Files",
    category: "computer",
    description: "Understand what a file is and how it contains content.",
    introducedLevel: 0
  },
  {
    id: "tool.files.folder",
    label: "Folders",
    category: "computer",
    description: "Understand folder structure and directory hierarchies.",
    introducedLevel: 0
  },
  {
    id: "tool.files.extension",
    label: "File Extensions",
    category: "computer",
    description: "Recognize the purpose of suffixes like .py or .txt.",
    introducedLevel: 0
  },
  {
    id: "tool.files.path",
    label: "File Paths",
    category: "computer",
    description: "Identify how to locate a file in a folder tree.",
    introducedLevel: 0
  },
  {
    id: "tool.terminal.prompt",
    label: "Terminal Prompt",
    category: "terminal",
    description: "Understand the terminal prompt interface.",
    introducedLevel: 0
  },
  {
    id: "tool.terminal.command",
    label: "Terminal Commands",
    category: "terminal",
    description: "Distinguish terminal inputs from program logic.",
    introducedLevel: 0
  },
  {
    id: "tool.terminal.stdout",
    label: "Standard Output",
    category: "terminal",
    description: "Recognize printed program output (stdout).",
    introducedLevel: 0
  },
  {
    id: "py.script.run",
    label: "Running Python Scripts",
    category: "python",
    description: "Invoke python command to execute a script.",
    introducedLevel: 0
  },
  {
    id: "py.print.literal",
    label: "Printing Literals",
    category: "python",
    description: "Print direct string/number values.",
    introducedLevel: 0
  },
  {
    id: "tool.feedback_loop.rerun",
    label: "Rerun Loop",
    category: "computer",
    description: "Edit, save, and rerun cycles.",
    introducedLevel: 0
  },
  {
    id: "debug.syntax_error.basic",
    label: "Basic Syntax Errors",
    category: "debugging",
    description: "Identify syntax warnings like unclosed quotes.",
    introducedLevel: 0
  },
  {
    id: "debug.line_number.basic",
    label: "Locating line numbers",
    category: "debugging",
    description: "Identify where an error occurred based on error feedback.",
    introducedLevel: 0
  },
  {
    id: "stderr.basic",
    label: "Standard Error basics",
    category: "terminal",
    description: "Distinguish successful output from error details.",
    introducedLevel: 0
  },

  // Level 1: Variables, Types, print
  {
    id: "py.variable.assignment",
    label: "Variable Assignment",
    category: "python",
    description: "Define a variable and assign a value.",
    introducedLevel: 1
  },
  {
    id: "py.string",
    label: "String data type",
    category: "python",
    description: "Manipulate text data.",
    introducedLevel: 1
  },
  {
    id: "py.integer",
    label: "Integer data type",
    category: "python",
    description: "Work with whole numbers.",
    introducedLevel: 1
  },
  {
    id: "py.boolean",
    label: "Boolean data type",
    category: "python",
    description: "Work with True and False values.",
    introducedLevel: 1
  },
  {
    id: "py.print.variable",
    label: "Printing Variables",
    category: "python",
    description: "Print values stored in variables.",
    introducedLevel: 1
  },
  {
    id: "py.comment",
    label: "Comments",
    category: "python",
    description: "Add explanatory notes using #.",
    introducedLevel: 1
  },
  {
    id: "py.arithmetic.add",
    label: "Addition",
    category: "python",
    description: "Add numbers.",
    introducedLevel: 1
  },
  {
    id: "py.arithmetic.multiply",
    label: "Multiplication",
    category: "python",
    description: "Multiply numbers.",
    introducedLevel: 1
  },
  {
    id: "py.arithmetic",
    label: "Arithmetic Operators",
    category: "python",
    description: "Perform basic mathematical calculations like addition and multiplication.",
    introducedLevel: 1
  },
  {
    id: "py.string.methods",
    label: "String Methods",
    category: "python",
    description: "Manipulate text data using built-in methods like .upper() or .strip().",
    introducedLevel: 1
  },
  {
    id: "py.integer_vs_string",
    label: "Integers vs Strings",
    category: "python",
    description: "Explain why 30 differs from \"30\".",
    introducedLevel: 1
  },
  {
    id: "py.f_string",
    label: "F-Strings",
    category: "python",
    description: "Interpolate variables inside string formatting.",
    introducedLevel: 1
  },
  {
    id: "py.str_conversion.basic",
    label: "String Conversion",
    category: "python",
    description: "Convert types to string using str().",
    introducedLevel: 1
  },

  // Level 2: Decisions, Loops, Collections
  {
    id: "py.comparison",
    label: "Comparison operators",
    category: "python",
    description: "Use operator flags like >= or ==.",
    introducedLevel: 2
  },
  {
    id: "py.boolean.expression",
    label: "Boolean Expressions",
    category: "python",
    description: "Construct logical conditions.",
    introducedLevel: 2
  },
  {
    id: "py.if_else",
    label: "Conditional branches",
    category: "python",
    description: "Use if/elif/else instructions.",
    introducedLevel: 2
  },
  {
    id: "py.indentation.block",
    label: "Indentation block syntax",
    category: "python",
    description: "Indent code sections to define local scopes.",
    introducedLevel: 2
  },
  {
    id: "py.list.literal",
    label: "List Literals",
    category: "python",
    description: "Define an array/list of items.",
    introducedLevel: 2
  },
  {
    id: "py.list.index",
    label: "List Indexing",
    category: "python",
    description: "Access items by zero-based position.",
    introducedLevel: 2
  },
  {
    id: "py.list.append",
    label: "List Append",
    category: "python",
    description: "Add new items dynamically.",
    introducedLevel: 2
  },
  {
    id: "py.dict.literal",
    label: "Dictionary Literals",
    category: "python",
    description: "Define key-value objects.",
    introducedLevel: 2
  },
  {
    id: "py.dict.key_lookup",
    label: "Dictionary Key Lookup",
    category: "python",
    description: "Retrieve values using specific keys.",
    introducedLevel: 2
  },
  {
    id: "py.key_error.basic",
    label: "Key Errors",
    category: "debugging",
    description: "Diagnose key retrieval issues.",
    introducedLevel: 2
  },
  {
    id: "py.record.list_of_dicts",
    label: "Repeated Records Structure",
    category: "python",
    description: "Define lists containing dictionaries.",
    introducedLevel: 2
  },
  {
    id: "py.record.consistent_keys",
    label: "Consistent Keys Structure",
    category: "python",
    description: "Avoid key mismatches across list items.",
    introducedLevel: 2
  },
  {
    id: "py.for_loop",
    label: "For Loops",
    category: "python",
    description: "Iterate across collections.",
    introducedLevel: 2
  },
  {
    id: "py.accumulator",
    label: "Accumulator pattern",
    category: "python",
    description: "Maintain running totals inside iterations.",
    introducedLevel: 2
  },
  {
    id: "py.loop_body",
    label: "Loop Body scoping",
    category: "python",
    description: "Handle repeated operations.",
    introducedLevel: 2
  },

  // Level 3: Functions
  {
    id: "py.function.motivation",
    label: "Function Motivation",
    category: "python",
    description: "Understand why we use functions to organize and reuse code.",
    introducedLevel: 3
  },
  {
    id: "py.function.call",
    label: "Calling Functions",
    category: "python",
    description: "Invoke defined functions to run their code.",
    introducedLevel: 3
  },
  {
    id: "py.function.def",
    label: "Defining Functions",
    category: "python",
    description: "Use def keywords to structure reusable segments.",
    introducedLevel: 3
  },
  {
    id: "py.parameter",
    label: "Parameters",
    category: "python",
    description: "Declare required parameters.",
    introducedLevel: 3
  },
  {
    id: "py.argument",
    label: "Arguments",
    category: "python",
    description: "Pass arguments during invocation.",
    introducedLevel: 3
  },
  {
    id: "py.return",
    label: "Return keyword",
    category: "python",
    description: "Return calculated outputs from scopes.",
    introducedLevel: 3
  },
  {
    id: "py.print_vs_return",
    label: "Print vs Return",
    category: "python",
    description: "Distinguish prints from return values.",
    introducedLevel: 3
  },
  {
    id: "py.decomposition.helper_function",
    label: "Function Decomposition",
    category: "python",
    description: "Structure complex programs into helper functions.",
    introducedLevel: 3
  },
  {
    id: "py.single_responsibility.basic",
    label: "Single Responsibility",
    category: "python",
    description: "Keep functions doing exactly one thing.",
    introducedLevel: 3
  },
  {
    id: "py.scope.local",
    label: "Local Scopes",
    category: "python",
    description: "Understand variable boundaries.",
    introducedLevel: 3
  },
  {
    id: "py.scope.global_read_risk",
    label: "Global Variable issues",
    category: "python",
    description: "Avoid dependency on external namespace globals.",
    introducedLevel: 3
  },

  // Level 4: Debugging, Tracebacks, Assertions, Testing
  {
    id: "debug.traceback",
    label: "Traceback anatomy",
    category: "debugging",
    description: "Interpret tracebacks.",
    introducedLevel: 4
  },
  {
    id: "debug.exception_name",
    label: "Exception Names",
    category: "debugging",
    description: "Recognize TypeError, ValueError, NameError.",
    introducedLevel: 4
  },
  {
    id: "debug.nameerror",
    label: "Name Error",
    category: "debugging",
    description: "Diagnose variables or functions that are referenced before definition.",
    introducedLevel: 4
  },
  {
    id: "debug.typeerror",
    label: "Type Error",
    category: "debugging",
    description: "Diagnose operations applied to inappropriate data types.",
    introducedLevel: 4
  },
  {
    id: "py.try_except",
    label: "Try Except Blocks",
    category: "python",
    description: "Catch and handle exceptions gracefully using try/except block.",
    introducedLevel: 4
  },
  {
    id: "debug.line_number",
    label: "Exception Line numbers",
    category: "debugging",
    description: "Pinpoint where bugs occur.",
    introducedLevel: 4
  },
  {
    id: "py.raise",
    label: "Raising exceptions",
    category: "python",
    description: "Raise errors manually.",
    introducedLevel: 4
  },
  {
    id: "py.value_error",
    label: "Value Errors",
    category: "python",
    description: "Signal invalid data entries.",
    introducedLevel: 4
  },
  {
    id: "debug.invalid_input",
    label: "Invalid Inputs",
    category: "debugging",
    description: "Define bounds like rejecting negative values.",
    introducedLevel: 4
  },
  {
    id: "py.assertion",
    label: "Assertions",
    category: "testing",
    description: "Use assert to encode logic invariants.",
    introducedLevel: 4
  },
  {
    id: "testing.expected_actual",
    label: "Expected vs Actual",
    category: "testing",
    description: "Compare test values explicitly.",
    introducedLevel: 4
  },
  {
    id: "testing.happy_path",
    label: "Happy Path testing",
    category: "testing",
    description: "Verify inputs within typical bounds.",
    introducedLevel: 4
  },
  {
    id: "testing.failure_path",
    label: "Failure Path testing",
    category: "testing",
    description: "Verify boundary / rejection behaviors.",
    introducedLevel: 4
  },
  {
    id: "testing.regression",
    label: "Regression Testing",
    category: "testing",
    description: "Prevent previous bugs from returning.",
    introducedLevel: 4
  },

  // Level 5: Files, CSV, JSON, CLI args
  {
    id: "tool.files.relative_path",
    label: "Relative Paths",
    category: "files",
    description: "Specify paths from workspace directories.",
    introducedLevel: 5
  },
  {
    id: "py.path.string",
    label: "Path strings",
    category: "files",
    description: "Reference files in Python code.",
    introducedLevel: 5
  },
  {
    id: "debug.file_not_found",
    label: "File Not Found handling",
    category: "debugging",
    description: "Recover from missing target path errors.",
    introducedLevel: 5
  },
  {
    id: "py.open.read",
    label: "File Opening",
    category: "files",
    description: "Open files for reading or writing.",
    introducedLevel: 5
  },
  {
    id: "py.with_statement",
    label: "Context Managers",
    category: "files",
    description: "Use with keywords for auto-closure of file handles.",
    introducedLevel: 5
  },
  {
    id: "files.input_text",
    label: "Reading File Contents",
    category: "files",
    description: "Load content from raw text streams.",
    introducedLevel: 5
  },
  {
    id: "py.csv",
    label: "CSV Handling",
    category: "files",
    description: "Import and use the CSV library module.",
    introducedLevel: 5
  },
  {
    id: "py.csv.reader",
    label: "CSV Reader usage",
    category: "files",
    description: "Parse columns using csv.DictReader.",
    introducedLevel: 5
  },
  {
    id: "py.json",
    label: "JSON Handling",
    category: "files",
    description: "Import and use the JSON library module.",
    introducedLevel: 5
  },
  {
    id: "py.json.dumps_loads",
    label: "JSON Serialization",
    category: "files",
    description: "Call json.loads and json.dumps.",
    introducedLevel: 5
  },
  {
    id: "py.sys.argv",
    label: "CLI argument arrays",
    category: "cli",
    description: "Retrieve commands via sys.argv.",
    introducedLevel: 5
  },
  {
    id: "py.argparse",
    label: "Command Argument Parsing",
    category: "cli",
    description: "Structure rich flags via argparse module.",
    introducedLevel: 5
  },

  // Level 6: Modules, Imports, Project structure, pyproject.toml
  {
    id: "py.import",
    label: "Imports",
    category: "project",
    description: "Use import to include modules.",
    introducedLevel: 6
  },
  {
    id: "py.module.local",
    label: "Local Modules",
    category: "project",
    description: "Import helper files locally.",
    introducedLevel: 6
  },
  {
    id: "py.package.init",
    label: "__init__.py",
    category: "project",
    description: "Define modules inside folder hierarchies.",
    introducedLevel: 6
  },
  {
    id: "py.pytest.basic",
    label: "Pytest framework",
    category: "testing",
    description: "Run automated tests via pytest.",
    introducedLevel: 6
  },
  {
    id: "py.pyproject.toml",
    label: "pyproject.toml",
    category: "project",
    description: "Maintain metadata details.",
    introducedLevel: 6
  },
  {
    id: "git.repo.local",
    label: "Local Git repository",
    category: "git",
    description: "Initialize a local git workspace.",
    introducedLevel: 6
  },
  {
    id: "git.stage.add",
    label: "Git stage / add",
    category: "git",
    description: "Stage files for commit.",
    introducedLevel: 6
  },
  {
    id: "git.commit.local",
    label: "Git commits",
    category: "git",
    description: "Save snapshots via commits.",
    introducedLevel: 6
  },
  {
    id: "github.repo.url",
    label: "GitHub Repository URLs",
    category: "git",
    description: "Upload code to remote GitHub repos.",
    introducedLevel: 6
  },

  // Level 7: Type Hints, Dataclasses, Validation
  {
    id: "py.typing.hints",
    label: "Type Hints",
    category: "typing",
    description: "Declare parameter and return value types.",
    introducedLevel: 7
  },
  {
    id: "py.typing.optional",
    label: "Optional types",
    category: "typing",
    description: "Handle potentially absent/None values.",
    introducedLevel: 7
  },
  {
    id: "py.dataclass",
    label: "Dataclasses",
    category: "typing",
    description: "Define clean class representations.",
    introducedLevel: 7
  },
  {
    id: "py.validation.schema",
    label: "Data validation boundaries",
    category: "data",
    description: "Enforce value ranges at boundaries.",
    introducedLevel: 7
  },

  // Level 8: SQLite & APIs
  {
    id: "py.sqlite",
    label: "SQLite Integration",
    category: "data",
    description: "Import sqlite3 module.",
    introducedLevel: 8
  },
  {
    id: "py.sqlite.query",
    label: "SQL Queries",
    category: "data",
    description: "Execute parameterized query statements.",
    introducedLevel: 8
  },
  {
    id: "py.api.client",
    label: "API Clients",
    category: "api",
    description: "Request data from external services.",
    introducedLevel: 8
  },
  {
    id: "py.http.status",
    label: "HTTP Status Codes",
    category: "api",
    description: "Evaluate response codes like 200 or 404.",
    introducedLevel: 8
  },
  {
    id: "py.api.retry",
    label: "Request Retries",
    category: "api",
    description: "Implement simple retry loops.",
    introducedLevel: 8
  },

  // Level 9: Logging, Config, Secrets, CI
  {
    id: "py.logging",
    label: "Logging basics",
    category: "ops",
    description: "Print diagnostic runs using logging module.",
    introducedLevel: 9
  },
  {
    id: "py.config.env",
    label: "Environment variables",
    category: "ops",
    description: "Use dotenv files to bypass credentials exposure.",
    introducedLevel: 9
  },
  {
    id: "ops.ci.github_actions.basic",
    label: "CI / Github Actions",
    category: "ops",
    description: "Automate code verifications on push requests.",
    introducedLevel: 9
  },

  // Level 10: Capstone
  {
    id: "ops.architecture.note",
    label: "Architecture Notes",
    category: "ops",
    description: "Explain software structure decisions.",
    introducedLevel: 10
  },
  {
    id: "evidence.portfolio",
    label: "Portfolio evidence",
    category: "evidence",
    description: "Provide senior review ready evidence of final capstones.",
    introducedLevel: 10
  }
];
