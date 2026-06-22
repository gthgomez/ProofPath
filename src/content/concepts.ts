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

  {
    id: "py.method",
    label: "Methods",
    category: "python",
    description: "Call built-in actions on values using dot notation.",
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
    id: "py.dict.get_set",
    label: "Dictionary Get and Set",
    category: "python",
    description: "Assign keys and use default retrieval.",
    introducedLevel: 2
  },
  {
    id: "py.module.guard",
    label: "Module Guard Pattern",
    category: "python",
    description: "Use if __name__ == '__main__': to separate run-now code from reusable imports.",
    introducedLevel: 2
  },
  {
    id: "py.module.guard.mechanics",
    label: "Module Guard Mechanics",
    category: "python",
    description: "Understand __name__ and __main__ dunders behind the if __name__ == '__main__': guard.",
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
    id: "debug.regression",
    label: "Regression Assertions",
    category: "debugging",
    description: "Write assertions that prove a fix works and catch the bug if it returns.",
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
    id: "debug.breakpoint.basic",
    label: "Breakpoint Debugger",
    category: "debugging",
    description: "Use Python's built-in breakpoint() to pause execution and inspect variables interactively.",
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
    description: "Open files for reading or writing (raw open() mechanics). Prefer py.file.input for the safe with-statement pattern.",
    introducedLevel: 5
  }, // DEPRECATED — use py.file.input
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
    description: "Load content from raw text streams. Prefer py.file.input for file-based reading.",
    introducedLevel: 5
  }, // DEPRECATED — use py.file.input
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
    introducedLevel: 5
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
  {
    id: "git.branch.create",
    label: "Git Branching",
    category: "git",
    description: "Create and name branches to isolate work on different features or fixes.",
    introducedLevel: 6
  },
  {
    id: "git.branch.switch",
    label: "Git Branch Switch",
    category: "git",
    description: "Switch between branches using git checkout or git switch to change working context.",
    introducedLevel: 6
  },
  {
    id: "git.branch.merge",
    label: "Git Merge",
    category: "git",
    description: "Use git merge to combine changes from one branch into another.",
    introducedLevel: 6
  },
  {
    id: "github.pull_request.create",
    label: "GitHub Pull Request Creation",
    category: "git",
    description: "Open a pull request on GitHub to propose changes and request review.",
    introducedLevel: 6
  },
  {
    id: "github.pull_request.review",
    label: "GitHub Pull Request Review",
    category: "git",
    description: "Review a pull request: read diff, leave comments, and approve or request changes.",
    introducedLevel: 6
  },
  {
    id: "github.pull_request.merge",
    label: "GitHub Pull Request Merge",
    category: "git",
    description: "Merge an approved pull request into the target branch and delete the feature branch.",
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

  {
    id: "py.testing.mock",
    label: "Mocking in Tests",
    category: "testing",
    description: "Replace real dependencies with controlled test doubles using unittest.mock.patch.",
    introducedLevel: 7
  },

  // Level 8: SQLite & APIs
  {
    id: "py.sqlite",
    label: "SQLite Integration",
    category: "data",
    description: "Import sqlite3 module.",
    introducedLevel: 7
  },
  {
    id: "py.sqlite.query",
    label: "SQL Queries",
    category: "data",
    description: "Execute parameterized query statements.",
    introducedLevel: 7
  },
  {
    id: "py.api.client",
    label: "API Clients",
    category: "api",
    description: "Request data from external services.",
    introducedLevel: 7
  },
  {
    id: "py.http.status",
    label: "HTTP Status Codes",
    category: "api",
    description: "Evaluate response codes like 200 or 404.",
    introducedLevel: 7
  },
  {
    id: "py.api.retry",
    label: "Request Retries",
    category: "api",
    description: "Implement simple retry loops.",
    introducedLevel: 8
  },
  {
    id: "py.api.rate_limit",
    label: "Rate Limiting",
    category: "api",
    description: "Handle API rate limits with exponential backoff and Retry-After headers.",
    introducedLevel: 8
  },
  {
    id: "py.api.cache",
    label: "Caching Strategies",
    category: "api",
    description: "Cache API responses with TTL to reduce calls and handle stale data.",
    introducedLevel: 8
  },
  {
    id: "py.api.circuit_breaker",
    label: "Circuit Breaker Pattern",
    category: "api",
    description: "Fail fast after consecutive failures with half-open recovery state.",
    introducedLevel: 8
  },

  // Level 9: Logging, Config, Secrets, CI
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
  {
    id: "py.secrets.env",
    label: "Secrets Management",
    category: "ops",
    description: "Load secrets from environment variables, never hardcode credentials.",
    introducedLevel: 9
  },
  {
    id: "ops.deploy.strategies",
    label: "Deployment Strategies",
    category: "ops",
    description: "Understand blue-green, canary, and rollback deployment patterns.",
    introducedLevel: 9
  },
  {
    id: "ops.monitoring.basics",
    label: "Monitoring Basics",
    category: "ops",
    description: "Set up structured logging, health checks, and alert thresholds.",
    introducedLevel: 9
  },

  // Level 10 reserved for future capstone concepts
  {
    id: "ops.architecture.note",
    label: "Architecture Notes",
    category: "ops",
    description: "Explain software structure decisions.",
    introducedLevel: 7
  },
  {
    id: "evidence.portfolio",
    label: "Portfolio evidence",
    category: "evidence",
    description: "Provide senior review ready evidence of final capstones.",
    introducedLevel: 7
  },

  // Level 5: File I/O and CLI
  {
    id: "py.file.input",
    label: "File Input",
    category: "python",
    description: "Read text files using open() and with statement.",
    introducedLevel: 5,
    aliases: ["py.open.read", "files.input_text"]
  },
  {
    id: "py.parser.separation",
    label: "Parser Separation",
    category: "python",
    description: "Keep file reading separate from parsing logic for testability.",
    introducedLevel: 5
  },
  {
    id: "py.test.assertions",
    label: "Test Assertions",
    category: "python",
    description: "Write assert statements in test functions to verify behavior.",
    introducedLevel: 5
  },
  {
    id: "py.test.failures",
    label: "Test Failure Behavior",
    category: "python",
    description: "Write tests that prove rejection behavior, not just happy paths.",
    introducedLevel: 5
  },
  {
    id: "py.cli.arguments",
    label: "CLI Arguments",
    category: "python",
    description: "Parse command-line arguments using argparse.",
    introducedLevel: 5
  },
  {
    id: "py.argparse.parser",
    label: "Argparse Parser",
    category: "python",
    description: "Build ArgumentParser with description, flags, types, and defaults.",
    introducedLevel: 5
  },
  {
    id: "py.cli.file_backed",
    label: "File-Backed CLI",
    category: "python",
    description: "Wire CLI argument to a file parser so the script accepts real input.",
    introducedLevel: 5
  },
  {
    id: "py.cli.integration",
    label: "CLI Integration",
    category: "python",
    description: "Connect CLI argument parsing to file reading and report generation.",
    introducedLevel: 5
  },
  {
    id: "py.cli.help_defaults",
    label: "CLI Help and Defaults",
    category: "python",
    description: "Add help text, default values, and choices to argparse arguments.",
    introducedLevel: 5
  },
  {
    id: "py.cli.constraints",
    label: "CLI Constraints",
    category: "python",
    description: "Validate CLI input using choices= and type= in argparse.",
    introducedLevel: 5
  },
  {
    id: "py.file.output",
    label: "File Output",
    category: "python",
    description: "Write results to a file using open() in write mode.",
    introducedLevel: 5
  },
  {
    id: "py.cli.artifacts",
    label: "CLI Artifacts",
    category: "python",
    description: "Produce output files from a CLI script.",
    introducedLevel: 5
  },
  {
    id: "py.report.rejections",
    label: "Rejection Report",
    category: "python",
    description: "Collect and display rows that failed parsing.",
    introducedLevel: 5
  },
  {
    id: "py.report.row_numbers",
    label: "Row-Numbered Report",
    category: "python",
    description: "Include original row numbers in rejection reports.",
    introducedLevel: 5
  },
  {
    id: "py.proof.readme",
    label: "README Proof",
    category: "evidence",
    description: "Document project purpose, usage, and evidence in a README.",
    introducedLevel: 5
  },
  {
    id: "py.proof.gaps",
    label: "Evidence Gaps",
    category: "evidence",
    description: "Identify missing evidence before submitting portfolio work.",
    introducedLevel: 5
  },
  {
    id: "py.gate.review",
    label: "Core Review Gate",
    category: "evidence",
    description: "Validate architecture, commands, and evidence before advancing.",
    introducedLevel: 5
  },
  {
    id: "py.gate.architecture",
    label: "Architecture Gate",
    category: "evidence",
    description: "Explain the CLI → parser → report structure in plain terms.",
    introducedLevel: 5
  },

  // Level 6: Professional Python
  {
    id: "py.structure.package",
    label: "Package Structure",
    category: "python",
    description: "Organise Python code into modules and packages with __init__.py.",
    introducedLevel: 6
  },
  {
    id: "py.structure.boundaries",
    label: "Module Boundaries",
    category: "python",
    description: "Separate domain logic, I/O, and CLI into distinct modules.",
    introducedLevel: 6
  },
  {
    id: "py.dataclass.model",
    label: "Dataclass Model",
    category: "python",
    description: "Use @dataclass to define typed data models with field annotations.",
    introducedLevel: 6
  },
  {
    id: "py.dataclass.validation",
    label: "Dataclass Validation",
    category: "python",
    description: "Add __post_init__ validation to dataclass models.",
    introducedLevel: 6
  },
  {
    id: "py.json.dumps",
    label: "JSON Serialisation",
    category: "python",
    description: "Serialise Python objects to JSON strings using json.dumps.",
    introducedLevel: 6
  },
  {
    id: "py.json.loads",
    label: "JSON Deserialisation",
    category: "python",
    description: "Parse JSON strings into Python objects using json.loads.",
    introducedLevel: 6
  },
  {
    id: "py.logging",
    label: "Logging basics",
    category: "ops",
    description: "Print diagnostic runs using logging module.",
    introducedLevel: 6
  },
  {
    id: "py.logging.warning",
    label: "Logging Warnings",
    category: "python",
    description: "Use logging.warning() and logging.error() for structured diagnostics.",
    introducedLevel: 6
  },
  {
    id: "py.errors.custom",
    label: "Custom Errors",
    category: "python",
    description: "Define custom exception classes by subclassing Exception.",
    introducedLevel: 6
  },
  {
    id: "py.pytest.fixtures",
    label: "Pytest Fixtures",
    category: "python",
    description: "Use @pytest.fixture to share test setup across test functions.",
    introducedLevel: 6
  },
  {
    id: "py.pytest.smoke",
    label: "Smoke Tests",
    category: "python",
    description: "Write end-to-end smoke tests that verify the full CLI output.",
    introducedLevel: 6
  },
  {
    id: "py.pytest.parametrize",
    label: "Pytest Parametrize",
    category: "testing",
    description: "Use @pytest.mark.parametrize to run the same test function with multiple input-output pairs.",
    introducedLevel: 6
  },
  {
    id: "py.pytest.raises",
    label: "Pytest Raises",
    category: "testing",
    description: "Use pytest.raises() to assert that a specific exception is raised during execution.",
    introducedLevel: 6
  },
  {
    id: "py.env.virtual",
    label: "Virtual Environments",
    category: "ops",
    description: "Isolate project dependencies using python -m venv, activate, and pip freeze.",
    introducedLevel: 6
  },
  {
    id: "py.metadata.pyproject",
    label: "pyproject.toml Metadata",
    category: "python",
    description: "Define project name, version, and dependencies in pyproject.toml.",
    introducedLevel: 6
  },
  {
    id: "py.metadata.dependencies",
    label: "Dependency Declarations",
    category: "python",
    description: "List runtime dependencies in pyproject.toml.",
    introducedLevel: 6
  },
  {
    id: "py.packaging.scripts",
    label: "Packaging Scripts",
    category: "python",
    description: "Declare CLI entry points using [project.scripts] in pyproject.toml.",
    introducedLevel: 6
  },
  {
    id: "py.packaging.install",
    label: "Editable Install",
    category: "python",
    description: "Install a package in editable mode using pip install -e .",
    introducedLevel: 6
  },
  {
    id: "py.config.loader",
    label: "Config Loader",
    category: "python",
    description: "Load configuration from files or environment variables at startup.",
    introducedLevel: 6
  },
  {
    id: "py.config.merge",
    label: "Config Merging",
    category: "python",
    description: "Merge config file values with CLI argument overrides.",
    introducedLevel: 6
  },
  {
    id: "py.ci.precommit",
    label: "Pre-commit Hooks",
    category: "ops",
    description: "Configure pre-commit to run linters and formatters on every commit.",
    introducedLevel: 6
  },
  {
    id: "py.ci.workflow",
    label: "CI Workflow",
    category: "ops",
    description: "Define a GitHub Actions workflow that runs tests on push.",
    introducedLevel: 6
  },
  {
    id: "py.gate.professional",
    label: "Professional Review Gate",
    category: "evidence",
    description: "Validate professional packaging, CI, and config before advancing.",
    introducedLevel: 6
  },
  {
    id: "py.gate.matrix",
    label: "Review Matrix",
    category: "evidence",
    description: "Map each layer to evidence, risk, and improvement decision.",
    introducedLevel: 6
  }
];
