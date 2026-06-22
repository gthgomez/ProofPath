import type { Lesson, Quiz, LessonPracticeBlock } from "@/domain/types";
import { proofLesson } from "./shared";

// ---------------------------------------------------------------------------
// Practice Reps for Level 8
// ---------------------------------------------------------------------------

const pythonRetryPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "class FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ndef fetch_with_retry(client, url, max_retries=3, timeout=5):\n    return []\n\n# Test: first try succeeds immediately.\nresponses = [FakeResponse(200, [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}])]\nclient = FakeClient(responses)\nprint(client.call_count)",
    expectedOutput: "call_count is 1 after a single successful fetch.",
    checkYourAnswer: "Repeat the success path with new dates and topic. If the retry wrapper makes multiple calls even on success, the logic is wrong.",
    tier: "replicate"
  },
  {
    starterCode: "class FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ndef fetch_with_retry(client, url, max_retries=3, timeout=5):\n    return []\n\n# Test: first try 503, second try succeeds.\nresponses = [FakeResponse(503, {'error': 'unavailable'}), FakeResponse(200, [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}])]\nclient = FakeClient(responses)\nprint(client.call_count)",
    expectedOutput: "call_count is 2 because the first attempt was retried after 503.",
    checkYourAnswer: "This failure rep proves retry actually happened. If call_count is 1, the function gave up on the first 503 instead of retrying.",
    tier: "diagnose"
  },
  {
    starterCode: "class FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ndef fetch_with_retry(client, url, max_retries=3, timeout=5):\n    return []\n\n# Test: all attempts return 503, should raise ApiError.\nresponses = [FakeResponse(503, {'error': 'down'})] * 4\nclient = FakeClient(responses)\nprint(client.call_count)",
    expectedOutput: "call_count is 3 (max_retries) and ApiError is raised after exhausting retries.",
    checkYourAnswer: "Project-shaped retry: the function should stop retrying after max_retries attempts and raise an error so the caller knows the API is unreachable.",
    tier: "synthesize"
  }
];

// ---- Rate Limiting Practice Reps ----

const pythonRateLimitPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "class FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ndef fetch_with_backoff(client, url, base_delay=1, max_delay=16):\n    return []\n\nresponses = [FakeResponse(200, [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}])]\nclient = FakeClient(responses)\nprint(client.call_count)",
    expectedOutput: "call_count is 1 after success on first try without rate limiting.",
    checkYourAnswer: "Repeat the success path with new data. The backoff function should return data immediately on 200.",
    tier: "replicate"
  },
  {
    starterCode: "class FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ndef fetch_with_backoff(client, url, base_delay=1, max_delay=16):\n    return []\n\nresponses = [FakeResponse(429, {'error': 'too many'}), FakeResponse(429, {'error': 'too many'}), FakeResponse(200, [])]\nclient = FakeClient(responses)\nprint(client.call_count)",
    expectedOutput: "call_count is 3 because the first two attempts were rate limited and retried.",
    checkYourAnswer: "This failure rep proves backoff happens. If call_count is 1, the function gave up on 429 instead of retrying with delay.",
    tier: "diagnose"
  },
  {
    starterCode: "class FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ndef fetch_with_backoff(client, url, base_delay=1, max_delay=16):\n    return []\n\nresponses = [FakeResponse(429, {})] * 6\nclient = FakeClient(responses)\ntry:\n    fetch_with_backoff(client, 'url')\nexcept Exception:\n    pass\nprint(client.call_count)",
    expectedOutput: "call_count is 5 (max 5 attempts) and an exception is raised after exhausting backoff retries.",
    checkYourAnswer: "Project-shaped backoff: the function should cap retries, double delay each time, and raise after all attempts fail.",
    tier: "synthesize"
  }
];

// ---- Caching Practice Reps ----

const pythonCachingPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "class FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ncache = {}\ndef fetch_with_cache(client, url):\n    return []\n\nresponses = [FakeResponse(200, [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}])]\nclient = FakeClient(responses)\nresult1 = fetch_with_cache(client, 'url')\nresult2 = fetch_with_cache(client, 'url')\nprint(client.call_count)",
    expectedOutput: "call_count is 1 because the second call used the cached result.",
    checkYourAnswer: "The second call should return the same data without calling the client again. If call_count is 2, caching is not working.",
    tier: "replicate"
  },
  {
    starterCode: "class FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ncache = {}\ndef fetch_with_cache(client, url):\n    return []\n\nresponses = [FakeResponse(200, [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}])]\nclient = FakeClient(responses)\nresult1 = fetch_with_cache(client, 'url')\nresult2 = fetch_with_cache(client, 'url')\nprint(client.call_count)",
    expectedOutput: "call_count is 1 because cache returns stored result on second call.",
    checkYourAnswer: "This test verifies the cache stores and returns data. If call_count is 2, cache dictionary was never populated.",
    tier: "diagnose"
  },
  {
    starterCode: "from functools import lru_cache\n\n@lru_cache(maxsize=32)\ndef fetch_data(url):\n    print(f'fetching {url}')\n    return f'data from {url}'\n\nprint(fetch_data('sessions'))\nprint(fetch_data('sessions'))\nprint(fetch_data('topics'))",
    expectedOutput: "fetching sessions appears once, data from sessions appears twice, then fetching topics appears once.",
    checkYourAnswer: "Project-shaped caching: use lru_cache to memoize API calls. The decorator caches based on arguments, so repeated calls with the same URL skip execution.",
    tier: "synthesize"
  }
];

// ---- Circuit Breaker Practice Reps ----

const pythonCircuitBreakerPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "class CircuitBreaker:\n    def __init__(self, threshold=3, recovery_timeout=5):\n        self.failure_count = 0\n        self.threshold = threshold\n        self.state = 'closed'\n        self.last_failure_time = 0\n    \ndef make_request(cb, client, url):\n    return []\n\ncb = CircuitBreaker(threshold=3)\nprint(cb.state)",
    expectedOutput: "circuit state is 'closed' when no failures have occurred yet.",
    checkYourAnswer: "Repeat the pattern with a different threshold. The circuit should start closed and only open after threshold failures.",
    tier: "replicate"
  },
  {
    starterCode: "class CircuitBreaker:\n    def __init__(self, threshold=3, recovery_timeout=5):\n        self.failure_count = 0\n        self.threshold = threshold\n        self.state = 'closed'\n        self.last_failure_time = 0\n    \ndef make_request(cb, client, url):\n    return []\n\ncb = CircuitBreaker(threshold=2)\nresult = make_request(cb, FakeClient(FakeResponse(503, {})), 'url')\nprint(cb.state)",
    expectedOutput: "circuit state is 'open' after 2 consecutive failures exceed the threshold.",
    checkYourAnswer: "This failure rep proves the circuit opens. If state is still 'closed', failure_count was not tracked correctly.",
    tier: "diagnose"
  },
  {
    starterCode: "from dataclasses import dataclass\nimport time\n\n@dataclass\nclass CircuitBreaker:\n    threshold: int = 3\n    recovery_timeout: float = 5.0\n    failure_count: int = 0\n    last_failure_time: float = 0.0\n    state: str = 'closed'\n\ndef make_request(cb, client, url):\n    return []\n\ncb = CircuitBreaker(threshold=2)\nprint(f'initial state: {cb.state}')\n# Simulate failures\nfor i in range(2):\n    try:\n        make_request(cb, FakeClient(FakeResponse(503, {})), 'url')\n    except Exception:\n        pass\nprint(f'after failures: {cb.state}')",
    expectedOutput: "initial state: closed, after failures: open, proving the circuit opens after threshold failures.",
    checkYourAnswer: "Project-shaped circuit breaker: track state transitions. After recovery_timeout, the circuit should transition to half-open state allowing a trial request.",
    tier: "synthesize"
  }
];

// ---------------------------------------------------------------------------
// Lesson 1 — Retry API Calls When the Server Is Unavailable (run_file)
// ---------------------------------------------------------------------------

const apiRetryLesson = proofLesson({
  id: "lesson-python-api-retry",
  moduleId: "module-python-api-resilience",
  slug: "python-api-retry",
  title: "Retry API Calls When the Server Is Unavailable",
  summary: "Add retry logic so the tracker handles temporary API failures gracefully.",
  bodyMarkdown: "Network requests sometimes fail with temporary errors like 503 Service Unavailable. A resilient client retries a few times before raising an error, so a brief outage does not crash the whole application.",
  estimatedMinutes: 14,
  difficulty: "applied",
  skillIds: ["skill-python-integration", "skill-api-contracts", "skill-testing-debugging"],
  quizId: "quiz-python-api-retry",
  desktopTask: "Create a fetch_with_retry function that retries on non-200 status codes up to max_retries times before raising ApiError.",
  evidencePrompt: "Record the retry loop logic, the success-on-first-try test, the success-after-retry test, and the exhausted-retries test.",
  language: "Python API resilience",
  tools: ["retry loop", "FakeClient", "status checks", "ApiError"],
  synopsis: "You are learning how to add retry logic to an API client. A retry means the client tries the request again when the server returns a temporary error, up to a maximum number of attempts.",
  prerequisites: [
    "Know how a safe API client checks status codes.",
    "Know that 503 Service Unavailable is a temporary error."
  ],
  testingFocus: "You will test that the retry wrapper succeeds on the first try, retries after a 503, and raises ApiError after exhausting retries.",
  objective: "Wrap API calls in a retry loop that handles temporary server errors.",
  whyItMatters: "Real APIs are not always available. A retry loop turns a fragile client into a resilient one without changing the rest of the service code.",
  coreConcept: "A retry loop wraps an API call with a counter. If the response is a temporary error (503), the loop waits briefly and tries again, up to max_retries. If all attempts fail, it raises an error.",
  workedExample: "fetch_with_retry(client, url, max_retries=3) retries up to 3 times when the server returns 503, but returns immediately on 200.",
  guidedExercise: "Write a fetch_with_retry wrapper that tries the client.get call, checks status, and retries on 503 up to max_retries times.",
  missionConnection: "This strengthens the integration utility by making the API client resilient to temporary failures.",
  reflectionPrompt: "Which HTTP status codes should trigger a retry, and which should fail immediately without retrying?",
  practiceStarter: "class ApiError(Exception):\n    pass\n\nclass FakeResponse:\n    def __init__(self, status_code, payload):\n        self.status_code = status_code\n        self._payload = payload\n    def json(self):\n        return self._payload\n\nclass FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ndef fetch_with_retry(client, url, max_retries=3, timeout=5):\n    return []",
  practiceExpected: "First-try success returns data immediately. 503-then-success retries and returns. All-503 raises ApiError.",
  practiceCheck: "If the retry function calls the client only once even after 503, there is no retry logic. Use a loop that tracks remaining attempts.",
  practiceReps: pythonRetryPracticeReps,
  miniTitle: "Build a retry wrapper for API calls",
  miniGoal: "Create a fetch_with_retry function that retries on 503 status up to max_retries times.",
  miniSteps: ["Loop up to max_retries times", "Call client.get with timeout", "Return data on 200 status", "Raise ApiError if all attempts fail"],
  miniDeliverables: ["fetch_with_retry function", "FakeResponse helper", "Success and failure test cases"],
  verifierCommand: "python -m pytest tests/test_retry.py",
  expectedEvidence: "Passing tests showing first-try success, retry-after-503 success, and retry-exhausted error.",
  projectConnection: "This makes the integration API client resilient enough for real-world use.",
  requiredCodeIncludes: ["fetch_with_retry", "max_retries", "ApiError", "503"],
  requiredOutputIncludes: ["api", "retry", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "class ApiError(Exception):\n    pass\n\nclass FakeResponse:\n    def __init__(self, status_code, payload):\n        self.status_code = status_code\n        self._payload = payload\n    def json(self):\n        return self._payload\n\nclass FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ndef fetch_with_retry(client, url, max_retries=3, timeout=5):\n    for attempt in range(max_retries):\n        response = client.get(url, timeout=timeout)\n        if response.status_code == 200:\n            return response.json()\n    raise ApiError(f'Failed after {max_retries} retries')",
  runnerTestCode: "# Test 1: Success on first try\nresponses_ok = [FakeResponse(200, [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}])]\nclient_ok = FakeClient(responses_ok)\nresult = fetch_with_retry(client_ok, 'https://example.test/sessions')\nassert result == [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}]\nassert client_ok.call_count == 1\n\n# Test 2: Retry on 503 then succeed\nresponses_retry = [FakeResponse(503, {'error': 'unavailable'}), FakeResponse(200, [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}])]\nclient_retry = FakeClient(responses_retry)\nresult = fetch_with_retry(client_retry, 'https://example.test/sessions')\nassert result == [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}]\nassert client_retry.call_count == 2\n\n# Test 3: Exhaust retries\nresponses_fail = [FakeResponse(503, {'error': 'down'})] * 4\nclient_fail = FakeClient(responses_fail)\ntry:\n    fetch_with_retry(client_fail, 'https://example.test/sessions')\n    assert False, 'should raise ApiError'\nexcept ApiError:\n    pass\n\nprint('api retry passed')",
  hiddenTests: [
    {
      id: "api-retry-stops-on-200",
      name: "Retry stops immediately on success",
      code: "responses = [FakeResponse(200, [])]\nclient = FakeClient(responses)\nfetch_with_retry(client, 'url')\nassert client.call_count == 1"
    },
    {
      id: "api-retry-respects-max-retries",
      name: "Retry respects max_retries count",
      code: "responses = [FakeResponse(503, {})] * 5\nclient = FakeClient(responses)\ntry:\n    fetch_with_retry(client, 'url', max_retries=2)\nexcept ApiError:\n    pass\nassert client.call_count == 2, f'expected 2 calls, got {client.call_count}'"
    }
  ],
  curriculum: {
    level: 8,
    sequence: 1,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.api.retry"],
    requires: ["py.api.client", "py.http.status"],
    visibleCodeConcepts: ["py.api.retry"],
    quizConcepts: ["py.api.retry"],
    usesButDoesNotTeach: ["py.import", "py.json"],
    proofOutputs: ["terminal_stdout"]
  }
});

apiRetryLesson.depth = {
  primaryConceptId: "py.api.retry",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.api.retry",
      definition: "Wrapping a network request in a loop that re-attempts the call on temporary failures up to a configurable maximum number of tries.",
      mentalModel: "Think of a retry loop as a persistent delivery person: if the door is not answered (503), they wait briefly and knock again, up to the number of tries you assigned. If no one answers after all tries, they leave a notice (exception).",
      syntaxShape: "for attempt in range(max_retries):\n    response = client.get(url)\n    if response.status_code == 200:\n        return response.json()",
      tinyExample: "for i in range(3):\n    resp = client.get(url)\n    if resp.status_code == 200:\n        return resp.json()",
      commonMistake: "Retrying on every error including 4xx client errors like 404, which never succeed on retry and waste resources.",
      repairHint: "Only retry on temporary server errors (5xx) like 503. Let 4xx client errors fail immediately.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-ret-1",
      label: "Retry loop structure",
      codeFragment: "for attempt in range(max_retries):\n        response = client.get(url, timeout=timeout)\n        if response.status_code == 200:\n            return response.json()\n    raise ApiError(f'Failed after {max_retries} retries')",
      conceptIds: ["py.api.retry"],
      explanation: "Loops up to max_retries times. On a successful 200 response, returns the parsed JSON immediately. If the loop finishes without success, raises an ApiError so the caller knows the operation failed.",
      learnerShouldBeAbleToSay: "I use a for loop with range(max_retries) so the function tries again on failure but gives up after the configured number of attempts."
    }
  ],
  guidedEdits: [
    {
      id: "g-ret-1",
      instruction: "Implement the retry loop: call client.get(url, timeout=timeout), check for 200 status, and return the parsed JSON on success.",
      conceptIds: ["py.api.retry"],
      targetCodeFragment: "return []",
      expectedObservation: "The fetch_with_retry function returns session data from the client on the first successful response.",
      wrongTurnHint: "After client.get, check if response.status_code == 200. If yes, return response.json(). If not, continue the loop."
    },
    {
      id: "g-ret-2",
      instruction: "After the loop, raise ApiError to signal that all retry attempts were exhausted.",
      conceptIds: ["py.api.retry"],
      targetCodeFragment: "def fetch_with_retry(client, url, max_retries=3, timeout=5):\n    for attempt in range(max_retries):\n        response = client.get(url, timeout=timeout)\n        if response.status_code == 200:\n            return response.json()\n    return []",
      expectedObservation: "The function raises ApiError instead of returning an empty list after all retries fail.",
      wrongTurnHint: "Replace the bare return [] with raise ApiError('Failed after N retries') after the loop body."
    }
  ],
  errorClinic: [
    {
      id: "e-ret-1",
      conceptIds: ["py.api.retry"],
      brokenExample: "def fetch_with_retry(client, url):\n    return client.get(url, timeout=5).json()",
      symptom: "If the server returns 503, the function immediately fails instead of retrying.",
      likelyCause: "There is no retry loop. The function calls get exactly once with no second chance on temporary errors.",
      fixStrategy: "Wrap the call in a for loop over range(max_retries), check status, and retry on non-200 responses."
    },
    {
      id: "e-ret-2",
      conceptIds: ["py.api.retry"],
      brokenExample: "for attempt in range(max_retries):\n    response = client.get(url, timeout)\n    return response.json()",
      symptom: "The loop never actually retries; it returns on the first attempt regardless of the status code.",
      likelyCause: "The return statement is inside the loop without checking the status code first, so every iteration exits the function immediately.",
      fixStrategy: "Move the return statement inside an if response.status_code == 200 check, so the loop continues on non-200 responses."
    }
  ],
  codeLabBridge: {
    story: "The safe API client handles one request, but real networks have temporary outages. A retry wrapper adds resilience without changing the client or service code.",
    usesConcepts: ["py.api.retry"],
    learnerOwns: ["fetch_with_retry"],
    checkerOwns: ["api-retry-stops-on-200", "api-retry-respects-max-retries"],
    runExpectation: "prints api retry passed"
  },
  understandingProofPrompt: "Why should you retry on 503 Service Unavailable but not on 404 Not Found? What makes an error retryable?",
  exitTicket: [
    "I can write a retry loop that re-attempts API calls on temporary failures.",
    "I understand why max_retries prevents infinite loops and wasted resources."
  ]
};

// ---------------------------------------------------------------------------
// Lesson 2 — Rate Limiting With Exponential Backoff (run_file)
// ---------------------------------------------------------------------------

const rateLimitingLesson = proofLesson({
  id: "lesson-python-rate-limiting",
  moduleId: "module-python-api-resilience",
  slug: "python-rate-limiting",
  title: "Rate Limiting With Exponential Backoff",
  summary: "Extend the API client to handle rate limits with exponential backoff and Retry-After headers.",
  bodyMarkdown: "APIs often rate-limit clients that send too many requests. When the server returns HTTP 429 Too Many Requests, a resilient client backs off with increasing delays before retrying. Exponential backoff means the delay doubles on each retry (1s, 2s, 4s, 8s...) so the server has time to recover.",
  estimatedMinutes: 15,
  difficulty: "applied",
  skillIds: ["skill-python-integration", "skill-api-contracts", "skill-testing-debugging"],
  quizId: "quiz-python-rate-limiting",
  desktopTask: "Create a fetch_with_backoff function that handles HTTP 429 by doubling delay on each retry, capped at max_delay.",
  evidencePrompt: "Record the backoff loop, the doubling delay logic, the Retry-After handling, and the exhausted-retries error case.",
  language: "Python rate limiting",
  tools: ["exponential backoff", "HTTP 429 handling", "Retry-After header", "FakeClient", "delay capping"],
  synopsis: "You are extending the API retry logic to handle rate limits. Exponential backoff means the delay doubles after each 429 response so the server has time to recover.",
  prerequisites: [
    "Know how retry loops work for 503 errors.",
    "Know that 429 Too Many Requests means the client is being rate-limited."
  ],
  testingFocus: "You will test that the function succeeds when no rate limit applies, retries with backoff after 429, and raises an error after exhausting retries.",
  objective: "Add exponential backoff to the retry logic for handling HTTP 429 rate limits.",
  whyItMatters: "Rate limits are a fact of API integration. Without backoff, retry loops flood the server and get blocked. With backoff, the client behaves politely and recovers gracefully.",
  coreConcept: "Exponential backoff multiplies the delay by a factor (usually 2) after each retry attempt, with a configurable maximum delay. The Retry-After header tells the client exactly how long to wait.",
  workedExample: "fetch_with_backoff(client, url, base_delay=1, max_delay=16) waits 1s, then 2s, then 4s, then 8s, then 16s between retries after 429 responses.",
  guidedExercise: "Write fetch_with_backoff that doubles the delay on each 429 response, caps at max_delay, and raises ApiError after exhausting retries.",
  missionConnection: "This adds rate-limit awareness to the API resilience toolkit, making the client production-ready.",
  reflectionPrompt: "Should all HTTP 4xx codes trigger a retry with backoff? Which ones should still fail immediately?",
  practiceStarter: "class ApiError(Exception):\n    pass\n\nclass FakeResponse:\n    def __init__(self, status_code, payload):\n        self.status_code = status_code\n        self._payload = payload\n    def json(self):\n        return self._payload\n\nclass FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ndef fetch_with_backoff(client, url, base_delay=1, max_delay=16):\n    return []",
  practiceExpected: "Success on first try returns data immediately. 429-then-success retries with backoff. All-429 raises ApiError.",
  practiceCheck: "If the function returns without raising after all rate-limited attempts, there is no failure signal. Use a loop with delay doubling and cap.",
  practiceReps: pythonRateLimitPracticeReps,
  miniTitle: "Add exponential backoff to API retry logic",
  miniGoal: "Create a fetch_with_backoff that doubles delay on each 429 response, capped at max_delay.",
  miniSteps: ["Loop with delay starting at base_delay", "Double delay after each 429", "Cap delay at max_delay", "Raise ApiError if all attempts fail"],
  miniDeliverables: ["fetch_with_backoff function", "Backoff with delay doubling", "Success and exhaustion test cases"],
  verifierCommand: "python -m pytest tests/test_rate_limit.py",
  expectedEvidence: "Passing tests showing first-try success, backoff-after-429 success, and retry-exhausted error.",
  projectConnection: "This makes the API client production-ready by handling rate limits gracefully.",
  requiredCodeIncludes: ["fetch_with_backoff", "base_delay", "max_delay", "429"],
  requiredOutputIncludes: ["api", "backoff", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "class ApiError(Exception):\n    pass\n\nclass FakeResponse:\n    def __init__(self, status_code, payload):\n        self.status_code = status_code\n        self._payload = payload\n    def json(self):\n        return self._payload\n\nclass FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ndef fetch_with_backoff(client, url, base_delay=1, max_delay=16):\n    delay = base_delay\n    for attempt in range(5):\n        response = client.get(url, timeout=5)\n        if response.status_code == 200:\n            return response.json()\n        elif response.status_code == 429:\n            import time\n            time.sleep(delay)\n            delay = min(delay * 2, max_delay)\n        else:\n            raise ApiError(f'HTTP {response.status_code}')\n    raise ApiError(f'Failed after 5 attempts')",
  runnerTestCode: "# Test 1: Success on first try\nresponses_ok = [FakeResponse(200, [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}])]\nclient_ok = FakeClient(responses_ok)\nresult = fetch_with_backoff(client_ok, 'https://example.test/sessions')\nassert result == [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}]\n\n# Test 2: 429 then success\nresponses_retry = [FakeResponse(429, {'error': 'too many'}), FakeResponse(200, [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}])]\nclient_retry = FakeClient(responses_retry)\nresult = fetch_with_backoff(client_retry, 'https://example.test/sessions')\nassert result == [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}]\nassert client_retry.call_count == 2\n\n# Test 3: Exhaust retries\nresponses_fail = [FakeResponse(429, {'error': 'too many'})] * 6\nclient_fail = FakeClient(responses_fail)\ntry:\n    fetch_with_backoff(client_fail, 'https://example.test/sessions')\n    assert False, 'should raise ApiError'\nexcept ApiError:\n    pass\n\nprint('api backoff passed')",
  hiddenTests: [
    {
      id: "backoff-doubles-delay",
      name: "Backoff delay doubles on each retry",
      code: "import time\nresponses = [FakeResponse(429, {}), FakeResponse(429, {}), FakeResponse(200, [])]\nclient = FakeClient(responses)\nstart = time.time()\nresult = fetch_with_backoff(client, 'url', base_delay=0.01, max_delay=0.1)\nelapsed = time.time() - start\nassert elapsed >= 0.03, f'expected at least 0.03s delay, got {elapsed}'\nassert client.call_count == 3"
    }
  ],
  curriculum: {
    level: 8,
    sequence: 2,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.api.rate_limit"],
    requires: ["py.api.retry", "py.import"],
    visibleCodeConcepts: ["py.api.rate_limit"],
    quizConcepts: ["py.api.rate_limit"],
    usesButDoesNotTeach: ["py.import", "py.json", "py.time"],
    proofOutputs: ["terminal_stdout"]
  }
});

rateLimitingLesson.depth = {
  primaryConceptId: "py.api.rate_limit",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.api.rate_limit",
      definition: "A retry strategy that increases the delay between attempts exponentially to give the server time to recover from rate limiting.",
      mentalModel: "Think of exponential backoff like asking a busy friend a question: if they say 'not now' (429), you wait longer each time until they have time or you give up.",
      syntaxShape: "delay = base_delay\nfor attempt in range(max_retries):\n    response = client.get(url)\n    if response.status_code == 429:\n        time.sleep(delay)\n        delay = min(delay * 2, max_delay)",
      tinyExample: "delay = 1\nfor i in range(3):\n    resp = client.get(url)\n    if resp.status_code == 429:\n        time.sleep(delay)\n        delay = min(delay * 2, 16)",
      commonMistake: "Retrying with a fixed delay instead of doubling, which still floods the server when the rate limit window is longer than the fixed delay.",
      repairHint: "Multiply the delay by 2 after each retry, and cap it at a reasonable maximum (e.g., 16 or 32 seconds).",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-rl-1",
      label: "Exponential delay doubling",
      codeFragment: "delay = base_delay\nfor attempt in range(5):\n    response = client.get(url, timeout=5)\n    if response.status_code == 429:\n        time.sleep(delay)\n        delay = min(delay * 2, max_delay)",
      conceptIds: ["py.api.rate_limit"],
      explanation: "Starts with base_delay. After each 429, sleeps for the current delay, then doubles it for the next attempt, capping at max_delay.",
      learnerShouldBeAbleToSay: "I use exponential backoff by doubling the delay after each rate-limit response, so the server gets progressively more time to recover."
    }
  ],
  guidedEdits: [
    {
      id: "g-rl-1",
      instruction: "Add the rate-limit check for HTTP 429 and implement exponential backoff with delay doubling.",
      conceptIds: ["py.api.rate_limit"],
      targetCodeFragment: "return []",
      expectedObservation: "The function handles 429 by waiting before retrying, and succeeds on subsequent attempts.",
      wrongTurnHint: "Check for response.status_code == 429, sleep delay seconds, then double the delay and continue the loop."
    },
    {
      id: "g-rl-2",
      instruction: "Cap the delay at max_delay so the wait does not grow indefinitely.",
      conceptIds: ["py.api.rate_limit"],
      targetCodeFragment: "delay = min(delay * 2, max_delay)",
      expectedObservation: "The delay stops growing once it reaches max_delay.",
      wrongTurnHint: "Use min() to set a ceiling: min(delay * 2, max_delay)."
    }
  ],
  errorClinic: [
    {
      id: "e-rl-1",
      conceptIds: ["py.api.rate_limit"],
      brokenExample: "for attempt in range(5):\n    response = client.get(url, timeout=5)\n    if response.status_code == 200:\n        return response.json()\n    time.sleep(1)",
      symptom: "The function retries with the same 1-second delay every time, flooding the server.",
      likelyCause: "The delay is fixed instead of doubling. The server never gets enough recovery time.",
      fixStrategy: "Use a variable delay that doubles after each attempt, starting from base_delay and capped at max_delay."
    },
    {
      id: "e-rl-2",
      conceptIds: ["py.api.rate_limit"],
      brokenExample: "if response.status_code == 429:\n    raise ApiError('Rate limited')",
      symptom: "The function gives up immediately on rate limits instead of retrying with backoff.",
      likelyCause: "Treating 429 as a fatal error rather than a temporary condition that backoff can resolve.",
      fixStrategy: "Add a retry loop and only raise after all attempts are exhausted."
    }
  ],
  codeLabBridge: {
    story: "The retry wrapper handles 503 errors, but real APIs also rate-limit clients with 429. Exponential backoff gives the server time to reset its rate-limit window.",
    usesConcepts: ["py.api.rate_limit"],
    learnerOwns: ["fetch_with_backoff"],
    checkerOwns: ["backoff-doubles-delay"],
    runExpectation: "prints api backoff passed"
  },
  understandingProofPrompt: "Why does exponential backoff work better than a fixed delay for handling API rate limits? What happens if max_delay is set too high?",
  exitTicket: [
    "I can implement exponential backoff for rate-limited API calls.",
    "I understand why delay capping prevents runaway wait times."
  ]
};

// ---------------------------------------------------------------------------
// Lesson 3 — Cache API Responses (run_file)
// ---------------------------------------------------------------------------

const cachingLesson = proofLesson({
  id: "lesson-python-api-caching",
  moduleId: "module-python-api-resilience",
  slug: "python-api-caching",
  title: "Cache API Responses to Avoid Redundant Calls",
  summary: "Add in-memory caching to the API client so repeated requests return cached data without network calls.",
  bodyMarkdown: "Fetching the same data repeatedly wastes time and API quota. Caching stores a previous response and returns it for identical requests. Python's functools.lru_cache decorator and simple dict-based caches are two ways to add caching to the Study Tracker API client.",
  estimatedMinutes: 14,
  difficulty: "applied",
  skillIds: ["skill-python-integration", "skill-api-contracts", "skill-testing-debugging"],
  quizId: "quiz-python-api-caching",
  desktopTask: "Add a caching layer to the API client that returns cached data for repeated URLs and invalidates after a TTL.",
  evidencePrompt: "Record the cache implementation, the lru_cache decorator usage, and tests proving cache hits reduce client calls.",
  language: "Python caching",
  tools: ["dict cache", "functools.lru_cache", "TTL", "cache invalidation", "FakeClient"],
  synopsis: "You are learning to cache API responses so the Study Tracker avoids redundant network calls. Caching stores previous responses keyed by URL and returns them for repeated requests.",
  prerequisites: [
    "Know how the API client fetches session data.",
    "Know that Python dicts can store key-value pairs."
  ],
  testingFocus: "You will test that the cache returns data without calling the client, that different URLs produce separate cache entries, and that cache invalidation works.",
  objective: "Cache API responses to eliminate redundant network calls.",
  whyItMatters: "APIs have rate limits and latency. Caching reduces load on the server, speeds up the app, and prevents unnecessary retries.",
  coreConcept: "Caching stores previous API responses in memory using a dictionary keyed by URL. functools.lru_cache provides automatic memoization with size limits. A TTL (time-to-live) expires stale entries.",
  workedExample: "A dict-based cache stores fetch(url) results. The second call with the same URL returns the cached dict without calling the client.",
  guidedExercise: "Wrap the fetch function with an in-memory cache. Store results by URL, return cached data on repeated calls, and add a TTL invalidation.",
  missionConnection: "This reduces redundant API calls in the Study Tracker, making it more efficient under heavy use.",
  reflectionPrompt: "When would a TTL-based cache be better than lru_cache? What data should never be cached?",
  practiceStarter: "class FakeResponse:\n    def __init__(self, status_code, payload):\n        self.status_code = status_code\n        self._payload = payload\n    def json(self):\n        return self._payload\n\nclass FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ncache = {}\ndef fetch_with_cache(client, url):\n    return []",
  practiceExpected: "First call fetches data, second call returns cached result without calling the client again.",
  practiceCheck: "If client.call_count is 2 after two calls to the same URL, caching is not working. The cache dict should be checked before calling the client.",
  practiceReps: pythonCachingPracticeReps,
  miniTitle: "Add caching to the API client",
  miniGoal: "Create a caching wrapper that stores API responses by URL and returns cached data for repeated calls.",
  miniSteps: ["Check cache dict before calling client", "Store response in cache keyed by URL", "Return cached data on repeated calls", "Add TTL invalidation for stale data"],
  miniDeliverables: ["fetch_with_cache function", "Cache hit and miss tests", "TTL invalidation test"],
  verifierCommand: "python -m pytest tests/test_caching.py",
  expectedEvidence: "Passing tests showing cache hits reduce call_count and TTL invalidation re-fetches stale data.",
  projectConnection: "This adds caching to the API resilience layer, reducing redundant network calls.",
  requiredCodeIncludes: ["fetch_with_cache", "cache", "call_count"],
  requiredOutputIncludes: ["api", "cache", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "class ApiError(Exception):\n    pass\n\nclass FakeResponse:\n    def __init__(self, status_code, payload):\n        self.status_code = status_code\n        self._payload = payload\n    def json(self):\n        return self._payload\n\nclass FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ncache = {}\ndef fetch_with_cache(client, url):\n    if url in cache:\n        return cache[url]\n    response = client.get(url, timeout=5)\n    if response.status_code == 200:\n        data = response.json()\n        cache[url] = data\n        return data\n    raise ApiError(f'HTTP {response.status_code}')",
  runnerTestCode: "# Test 1: Cache miss fetches from client\nresponses1 = [FakeResponse(200, [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}])]\nclient1 = FakeClient(responses1)\nresult1 = fetch_with_cache(client1, 'https://example.test/sessions')\nassert result1 == [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}]\n\n# Test 2: Cache hit does not call client again\nresult2 = fetch_with_cache(client1, 'https://example.test/sessions')\nassert result2 == [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}]\nassert client1.call_count == 1, f'expected 1 call, got {client1.call_count}'\n\n# Test 3: Different URL is a different cache key\nresponses3 = [FakeResponse(200, [{'date': '2026-06-02', 'topic': 'git', 'minutes': 15}])]\nclient3 = FakeClient(responses3)\nresult3 = fetch_with_cache(client3, 'https://example.test/topics')\nassert result3 == [{'date': '2026-06-02', 'topic': 'git', 'minutes': 15}]\n\nprint('api cache passed')",
  hiddenTests: [
    {
      id: "cache-handles-client-error",
      name: "Cache does not store error responses",
      code: "try:\n    fetch_with_cache(FakeClient([FakeResponse(503, {})]), 'https://example.test/sessions')\nexcept ApiError:\n    pass\n# Cache should not have stored the failed response\nassert 'https://example.test/sessions' not in cache, 'cache should not store errors'"
    }
  ],
  curriculum: {
    level: 8,
    sequence: 3,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.api.cache"],
    requires: ["py.api.retry", "py.import", "py.dict.literal"],
    visibleCodeConcepts: ["py.api.cache"],
    quizConcepts: ["py.api.cache"],
    usesButDoesNotTeach: ["py.import", "py.json"],
    proofOutputs: ["terminal_stdout"]
  }
});

cachingLesson.depth = {
  primaryConceptId: "py.api.cache",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.api.cache",
      definition: "Storing API response data in memory keyed by URL so repeated requests return the stored result without making a real network call.",
      mentalModel: "Think of caching like a photocopy machine. The first time you request a document, you make a copy (network call). The second time, you hand them the existing copy instead of walking to the file cabinet again.",
      syntaxShape: "cache = {}\ndef fetch(url):\n    if url in cache:\n        return cache[url]\n    data = client.get(url)\n    cache[url] = data\n    return data",
      tinyExample: "cache = {}\ndef get_data(url):\n    if url not in cache:\n        cache[url] = fetch(url)\n    return cache[url]",
      commonMistake: "Storing error responses in the cache, so subsequent calls get stale error data instead of retrying.",
      repairHint: "Only store successful responses in the cache. Raise or return errors without caching them.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-cache-1",
      label: "Cache check before API call",
      codeFragment: "if url in cache:\n        return cache[url]\nresponse = client.get(url, timeout=5)\nif response.status_code == 200:\n    data = response.json()\n    cache[url] = data\n    return data",
      conceptIds: ["py.api.cache"],
      explanation: "Checks the cache dict first. If the URL is found, returns stored data immediately. Otherwise calls the client and stores the result before returning.",
      learnerShouldBeAbleToSay: "I check the cache before making the API call, so repeated requests skip the network entirely."
    }
  ],
  guidedEdits: [
    {
      id: "g-cache-1",
      instruction: "Add a cache check that returns cached data before calling the client.",
      conceptIds: ["py.api.cache"],
      targetCodeFragment: "return []",
      expectedObservation: "A second call with the same URL returns data without increasing call_count.",
      wrongTurnHint: "Check if url in cache: at the start of the function. If found, return cache[url] immediately."
    },
    {
      id: "g-cache-2",
      instruction: "Store successful responses in the cache so repeated calls skip the network.",
      conceptIds: ["py.api.cache"],
      targetCodeFragment: "cache = {}\ndef fetch_with_cache(client, url):\n    if url in cache:\n        return cache[url]\n    response = client.get(url, timeout=5)\n    if response.status_code == 200:\n        data = response.json()\n        cache[url] = data",
      expectedObservation: "The cache stores validated data from successful responses only.",
      wrongTurnHint: "Only store in cache after confirming status_code is 200. Do not cache error responses."
    }
  ],
  errorClinic: [
    {
      id: "e-cache-1",
      conceptIds: ["py.api.cache"],
      brokenExample: "def fetch_with_cache(client, url):\n    return cache[url] if url in cache else client.get(url, timeout=5).json()",
      symptom: "The function raises a KeyError on first call before anything is cached, or caches raw error responses.",
      likelyCause: "No explicit cache population step. The function reads from cache but never writes to it after fetching.",
      fixStrategy: "Separate the cache read, fetch, validation, and cache write into explicit steps."
    },
    {
      id: "e-cache-2",
      conceptIds: ["py.api.cache"],
      brokenExample: "cache[url] = response.json()\nreturn cache[url]",
      symptom: "Error responses with non-200 status are cached, so subsequent calls return bad data without retrying.",
      likelyCause: "Caching the response before checking the HTTP status code.",
      fixStrategy: "Check response.status_code == 200 before calling .json() and storing in cache."
    }
  ],
  codeLabBridge: {
    story: "With retry and rate limiting in place, caching prevents redundant network calls. The same session data might be requested multiple times — caching avoids the unnecessary overhead.",
    usesConcepts: ["py.api.cache"],
    learnerOwns: ["fetch_with_cache"],
    checkerOwns: ["cache-handles-client-error"],
    runExpectation: "prints api cache passed"
  },
  understandingProofPrompt: "When would you want a TTL (time-to-live) on cached data instead of caching indefinitely? What kind of API data becomes stale fastest?",
  exitTicket: [
    "I can add an in-memory cache to avoid redundant API calls.",
    "I understand why error responses should not be cached."
  ]
};

// ---------------------------------------------------------------------------
// Lesson 4 — Circuit Breaker Pattern (run_file)
// ---------------------------------------------------------------------------

const circuitBreakerLesson = proofLesson({
  id: "lesson-python-circuit-breaker",
  moduleId: "module-python-api-resilience",
  slug: "python-circuit-breaker",
  title: "Circuit Breaker Pattern for API Resilience",
  summary: "Protect the API client from cascading failures by failing fast when the upstream service is down.",
  bodyMarkdown: "When an API repeatedly fails, retrying just wastes time and resources. A circuit breaker tracks consecutive failures and 'opens' the circuit to fail fast. After a recovery timeout, it transitions to 'half-open' to test if the service has recovered. This prevents cascading failures and lets the system recover gracefully.",
  estimatedMinutes: 16,
  difficulty: "applied",
  skillIds: ["skill-python-integration", "skill-api-contracts", "skill-testing-debugging"],
  quizId: "quiz-python-circuit-breaker",
  desktopTask: "Create a CircuitBreaker class with closed/open/half-open states, failure threshold, and recovery timeout.",
  evidencePrompt: "Record the CircuitBreaker class, tests for all three states, and the state transition logic.",
  language: "Python circuit breaker",
  tools: ["CircuitBreaker class", "state machine", "failure threshold", "recovery timeout", "half-open probe"],
  synopsis: "You are learning the circuit breaker pattern to protect the API client from cascading failures. The circuit tracks failures and opens after a threshold, then probes for recovery.",
  prerequisites: [
    "Know how retry loops handle temporary failures.",
    "Know the difference between transient and persistent failures."
  ],
  testingFocus: "You will test that the circuit starts closed, opens after threshold failures, rejects fast in open state, and transitions to half-open after recovery timeout.",
  objective: "Implement a circuit breaker that fails fast on persistent API failures and probes for recovery.",
  whyItMatters: "Retrying a failing API wastes time and resources. A circuit breaker detects persistent failure, stops retrying, and periodically tests for recovery — a key resilience pattern.",
  coreConcept: "A circuit breaker has three states: closed (normal operation, tracking failures), open (fail fast, no requests sent), and half-open (trial request to test recovery). It opens after a configurable failure threshold and transitions to half-open after a recovery timeout.",
  workedExample: "CircuitBreaker(threshold=3, recovery_timeout=30) starts closed. After 3 consecutive failures it opens. After 30 seconds it becomes half-open, allowing one trial request.",
  guidedExercise: "Write a CircuitBreaker class with failure counting, state transitions, and a make_request wrapper that checks state before calling the client.",
  missionConnection: "This completes the API resilience toolkit with a production-grade circuit breaker pattern.",
  reflectionPrompt: "What should happen to cached data when the circuit is open? Should the cache still serve stale data?",
  practiceStarter: "from dataclasses import dataclass\nimport time\n\n@dataclass\nclass CircuitBreaker:\n    threshold: int = 3\n    recovery_timeout: float = 30.0\n    failure_count: int = 0\n    last_failure_time: float = 0.0\n    state: str = 'closed'\n\nclass FakeResponse:\n    def __init__(self, status_code, payload):\n        self.status_code = status_code\n        self._payload = payload\n    def json(self):\n        return self._payload\n\nclass FakeClient:\n    def __init__(self, responses):\n        self.responses = responses\n        self.call_count = 0\n    def get(self, url, timeout):\n        resp = self.responses[self.call_count]\n        self.call_count += 1\n        return resp\n\ndef make_request(cb, client, url):\n    return []",
  practiceExpected: "Circuit transitions: closed -> open after threshold failures -> half-open after recovery timeout -> closed on success.",
  practiceCheck: "If the circuit stays closed after threshold failures, failure_count is not being incremented. If it never transitions to half-open, recovery timeout is not checked.",
  practiceReps: pythonCircuitBreakerPracticeReps,
  miniTitle: "Build a circuit breaker for API calls",
  miniGoal: "Create a CircuitBreaker with closed/open/half-open states and a failure threshold.",
  miniSteps: ["Track failure_count and state", "Open circuit after threshold failures", "Check recovery timeout for half-open transition", "Allow trial request in half-open state"],
  miniDeliverables: ["CircuitBreaker class", "State transition logic", "Tests for all three states"],
  verifierCommand: "python -m pytest tests/test_circuit_breaker.py",
  expectedEvidence: "Passing tests for closed, open, half-open states, failure threshold, and recovery timeout.",
  projectConnection: "This completes the API resilience layer for the Study Tracker integration service.",
  requiredCodeIncludes: ["CircuitBreaker", "failure_count", "state", "threshold"],
  requiredOutputIncludes: ["api", "circuit", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "from dataclasses import dataclass\nimport time\n\nclass ApiError(Exception):\n    pass\n\n@dataclass\nclass CircuitBreaker:\n    threshold: int = 3\n    recovery_timeout: float = 30.0\n    failure_count: int = 0\n    last_failure_time: float = 0.0\n    state: str = 'closed'\n\ndef make_request(cb, client, url):\n    if cb.failure_count >= cb.threshold:\n        cb.state = 'open'\n        if time.time() - cb.last_failure_time >= cb.recovery_timeout:\n            cb.state = 'half-open'\n        else:\n            raise ApiError('Circuit is open')\n    try:\n        response = client.get(url, timeout=5)\n        if response.status_code == 200:\n            cb.failure_count = 0\n            cb.state = 'closed'\n            return response.json()\n        else:\n            cb.failure_count += 1\n            cb.last_failure_time = time.time()\n            raise ApiError(f'HTTP {response.status_code}')\n    except ApiError:\n        raise\n    except Exception as e:\n        cb.failure_count += 1\n        cb.last_failure_time = time.time()\n        raise",
  runnerTestCode: "# Test 1: Closed circuit allows requests\ncb1 = CircuitBreaker(threshold=2, recovery_timeout=0.1)\nresponses_ok = [FakeResponse(200, [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}])]\nresult = make_request(cb1, FakeClient(responses_ok), 'url')\nassert result == [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}]\nassert cb1.state == 'closed'\n\n# Test 2: Circuit opens after threshold failures\ncb2 = CircuitBreaker(threshold=2, recovery_timeout=0.1)\nfor i in range(2):\n    try:\n        make_request(cb2, FakeClient([FakeResponse(503, {})]), 'url')\n    except ApiError:\n        pass\nassert cb2.state == 'open', f'expected open, got {cb2.state}'\n\n# Test 3: Half-open after recovery timeout\ncb3 = CircuitBreaker(threshold=2, recovery_timeout=0.05)\nfor i in range(2):\n    try:\n        make_request(cb3, FakeClient([FakeResponse(503, {})]), 'url')\n    except ApiError:\n        pass\ntime.sleep(0.06)\n# Should now be half-open\nresult = make_request(cb3, FakeClient([FakeResponse(200, [{'date': '2026-06-01', 'topic': 'python', 'minutes': 30}])]), 'url')\nassert cb3.state == 'closed', f'expected closed after half-open success, got {cb3.state}'\n\nprint('api circuit passed')",
  hiddenTests: [
    {
      id: "circuit-rejects-when-open",
      name: "Circuit rejects requests when open",
      code: "cb = CircuitBreaker(threshold=1, recovery_timeout=999)\ntry:\n    make_request(cb, FakeClient([FakeResponse(503, {})]), 'url')\nexcept ApiError:\n    pass\ntry:\n    make_request(cb, FakeClient([FakeResponse(200, [])]), 'url')\n    assert False, 'should raise when open'\nexcept ApiError:\n    pass\nassert cb.state == 'open'"
    }
  ],
  curriculum: {
    level: 8,
    sequence: 4,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.api.circuit_breaker"],
    requires: ["py.api.retry", "py.api.rate_limit", "py.dataclass"],
    visibleCodeConcepts: ["py.api.circuit_breaker"],
    quizConcepts: ["py.api.circuit_breaker"],
    usesButDoesNotTeach: ["py.import", "py.time", "py.dataclass", "py.json"],
    proofOutputs: ["terminal_stdout"]
  }
});

circuitBreakerLesson.depth = {
  primaryConceptId: "py.api.circuit_breaker",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.api.circuit_breaker",
      definition: "A pattern that tracks consecutive API failures and stops all requests when a threshold is reached, then periodically tests for recovery.",
      mentalModel: "Think of a circuit breaker like a power switch: when too many things go wrong (failures exceed threshold), the switch flips to 'off' (open) so you stop trying. After a cooldown, you flip it to 'test' (half-open) to see if the problem is fixed.",
      syntaxShape: "if failure_count >= threshold:\n    if time_elapsed >= recovery_timeout:\n        state = 'half-open'\n    else:\n        raise CircuitOpenError()",
      tinyExample: "if cb.failure_count >= cb.threshold:\n    cb.state = 'open'\nif cb.state == 'half-open':\n    # allow one trial request",
      commonMistake: "Not resetting failure_count after a successful half-open request, so the circuit immediately opens again.",
      repairHint: "Set failure_count = 0 and state = 'closed' after a successful request in half-open state.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-cb-1",
      label: "State check before request",
      codeFragment: "if cb.failure_count >= cb.threshold:\n        cb.state = 'open'\n        if time.time() - cb.last_failure_time >= cb.recovery_timeout:\n            cb.state = 'half-open'\n        else:\n            raise ApiError('Circuit is open')",
      conceptIds: ["py.api.circuit_breaker"],
      explanation: "Checks if failures exceed the threshold. If so, marks the circuit as open. If enough time has passed since the last failure, transitions to half-open for a trial request.",
      learnerShouldBeAbleToSay: "I check failure_count against threshold before each request, and use recovery_timeout to decide when to probe for recovery."
    }
  ],
  guidedEdits: [
    {
      id: "g-cb-1",
      instruction: "Add failure tracking: increment failure_count on non-200 responses and record the last_failure_time.",
      conceptIds: ["py.api.circuit_breaker"],
      targetCodeFragment: "return []",
      expectedObservation: "After threshold consecutive failures, the circuit state becomes 'open'.",
      wrongTurnHint: "After each failed client.get call, increment cb.failure_count and set cb.last_failure_time = time.time()."
    },
    {
      id: "g-cb-2",
      instruction: "Add the half-open transition: after recovery_timeout elapses, allow one trial request.",
      conceptIds: ["py.api.circuit_breaker"],
      targetCodeFragment: "if cb.failure_count >= cb.threshold:\n        cb.state = 'open'\n        raise ApiError('Circuit is open')",
      expectedObservation: "After recovery_timeout, the circuit allows a trial request and resets to closed on success.",
      wrongTurnHint: "Before raising ApiError, check if time.time() - cb.last_failure_time >= cb.recovery_timeout. If so, set state to 'half-open' instead of raising."
    }
  ],
  errorClinic: [
    {
      id: "e-cb-1",
      conceptIds: ["py.api.circuit_breaker"],
      brokenExample: "if failure_count >= 3:\n    state = 'open'\n    return []",
      symptom: "The function returns an empty list instead of raising an error when the circuit is open, hiding the failure from the caller.",
      likelyCause: "Returning a default value instead of raising an exception in the open state.",
      fixStrategy: "Raise a specific exception (e.g., ApiError('Circuit is open')) so the caller knows the request did not go through."
    },
    {
      id: "e-cb-2",
      conceptIds: ["py.api.circuit_breaker"],
      brokenExample: "cb.failure_count = 0  # Reset on every request",
      symptom: "The circuit never opens because the failure count is reset before it reaches the threshold.",
      likelyCause: "Resetting the failure count at the start of every request instead of only on success.",
      fixStrategy: "Only reset failure_count to 0 after a successful response, not at the beginning of every request."
    }
  ],
  codeLabBridge: {
    story: "Retry and backoff handle transient errors, but a truly down service needs a circuit breaker. The circuit opens after repeated failures, fails fast, and probes for recovery.",
    usesConcepts: ["py.api.circuit_breaker"],
    learnerOwns: ["CircuiBreaker", "make_request"],
    checkerOwns: ["circuit-rejects-when-open"],
    runExpectation: "prints api circuit passed"
  },
  understandingProofPrompt: "Why is a circuit breaker better than retrying indefinitely when a service is truly down? What recovery pattern does the half-open state enable?",
  exitTicket: [
    "I can implement a circuit breaker with closed, open, and half-open states.",
    "I understand why failing fast is better than retrying a persistently broken service."
  ]
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const level8Lessons: Lesson[] = [
  apiRetryLesson,
  rateLimitingLesson,
  cachingLesson,
  circuitBreakerLesson
];

export const level8Quizzes: Quiz[] = [
  {
    id: "quiz-python-api-retry",
    lessonId: "lesson-python-api-retry",
    title: "API retry checkpoint",
    passingScore: 80,
    questions: [
      {
        id: "question-python-api-retry-1",
        prompt: "What does this code do when the first two calls return 503?\n```python\ndef fetch_with_retry(client, url, max_retries=3):\n    for attempt in range(max_retries):\n        resp = client.get(url, timeout=5)\n        if resp.status_code == 200:\n            return resp.json()\n    raise ApiError(f\"Failed after {max_retries} retries\")\n```",
        choices: ["Returns empty data after the first 503", "Retries up to 3 times, then raises ApiError if all fail", "Ignores the status code and returns the response"],
        correctChoiceIndex: 1,
        explanation: "The loop iterates up to max_retries (3). Only when all attempts return non-200 does it raise ApiError.",
        conceptIds: ["py.api.retry"]
      },
      {
        id: "question-python-api-retry-2",
        prompt: "Your fetch_with_retry calls the API only once even after a 503. The client's call_count is 1. What is wrong?",
        choices: ["The retry loop returns on every iteration instead of only on 200", "The max_retries value is too high", "The API cannot be reached"],
        correctChoiceIndex: 0,
        explanation: "The return statement is probably placed outside the status check, causing the function to exit on every attempt regardless of status.",
        conceptIds: ["py.api.retry"]
      },
      {
        id: "question-python-api-retry-3",
        prompt: "Why should a retry loop retry on 503 Service Unavailable but not on 404 Not Found?",
        choices: ["Because 504 is also a temporary error", "Because 503 and 404 are treated the same", "Because 503 is temporary while 404 is a client mistake that will not resolve"],
        correctChoiceIndex: 2,
        explanation: "503 is a temporary server error; 404 is a client mistake (wrong URL) that will repeat on every retry.",
        conceptIds: ["py.api.retry"]
      }
    ]
  },
  {
    id: "quiz-python-rate-limiting",
    lessonId: "lesson-python-rate-limiting",
    title: "Rate limiting checkpoint",
    passingScore: 80,
    questions: [
      {
        id: "question-python-rate-limiting-1",
        prompt: "What does exponential backoff do after a 429 response?\n```python\ndelay = 1\nfor attempt in range(5):\n    resp = client.get(url, timeout=5)\n    if resp.status_code == 429:\n        time.sleep(delay)\n        delay = min(delay * 2, 16)\n    elif resp.status_code == 200:\n        return resp.json()\nraise ApiError('Failed')\n```",
        choices: ["Keeps the delay fixed at 1 second", "Doubles the delay each retry up to a cap of 16 seconds", "Triples the delay immediately"],
        correctChoiceIndex: 1,
        explanation: "delay *= 2 doubles the wait each time, capped at max_delay (16) to prevent excessive waits.",
        conceptIds: ["py.api.rate_limit"]
      },
      {
        id: "question-python-rate-limiting-2",
        prompt: "Your backoff function retries 5 times with a fixed 1-second delay after 429. Why is this wrong?",
        choices: ["Fixed delay works fine for rate limits", "The server needs exponentially more time to recover, and a fixed delay may still flood it", "Because delays should decrease, not stay the same"],
        correctChoiceIndex: 1,
        explanation: "Fixed delays do not give the server progressively more recovery time. Exponential backoff lets the server catch up.",
        conceptIds: ["py.api.rate_limit"]
      },
      {
        id: "question-python-rate-limiting-3",
        prompt: "Why should max_delay cap the exponential growth of the backoff delay?",
        choices: ["To prevent the delay from growing unreasonably long (e.g., hours)", "To make the function fail faster", "Because delays should always be 1 second"],
        correctChoiceIndex: 0,
        explanation: "Without a cap, exponential growth can produce unreasonably long delays (e.g., after 20 retries, the delay would be 1,048,576 seconds).",
        conceptIds: ["py.api.rate_limit"]
      }
    ]
  },
  {
    id: "quiz-python-api-caching",
    lessonId: "lesson-python-api-caching",
    title: "API caching checkpoint",
    passingScore: 80,
    questions: [
      {
        id: "question-python-api-caching-1",
        prompt: "What does this cache wrapper do on the second call with the same URL?\n```python\ncache = {}\ndef fetch(url):\n    if url in cache:\n        return cache[url]\n    data = api.get(url)\n    cache[url] = data\n    return data\n```",
        choices: ["Returns the cached data without calling the API again", "Fetches data again and overwrites the cache", "Raises a KeyError"],
        correctChoiceIndex: 0,
        explanation: "The 'if url in cache' check returns stored data immediately on the second call, skipping the API call entirely.",
        conceptIds: ["py.api.cache"]
      },
      {
        id: "question-python-api-caching-2",
        prompt: "Your cache returns stale data that was fetched an hour ago. The API data may have changed. What is missing?",
        choices: ["A second API client", "More cache storage space", "A TTL (time-to-live) that expires old entries"],
        correctChoiceIndex: 2,
        explanation: "Without a TTL, cached data lives forever. A TTL expires entries after a set duration so fresh data is fetched periodically.",
        conceptIds: ["py.api.cache"]
      },
      {
        id: "question-python-api-caching-3",
        prompt: "Why should error responses not be stored in the cache?",
        choices: ["Because they take up too much memory", "Because storing an error means subsequent calls get a cached error instead of retrying", "Because errors are never JSON-serializable"],
        correctChoiceIndex: 1,
        explanation: "Caching error responses makes the client think the API is still down even after the service recovers.",
        conceptIds: ["py.api.cache"]
      }
    ]
  },
  {
    id: "quiz-python-circuit-breaker",
    lessonId: "lesson-python-circuit-breaker",
    title: "Circuit breaker checkpoint",
    passingScore: 80,
    questions: [
      {
        id: "question-python-circuit-breaker-1",
        prompt: "What does a circuit breaker do after the failure threshold is exceeded?",
        choices: ["Keeps retrying with longer delays", "Opens the circuit and fails fast for all subsequent requests", "Ignores future failures"],
        correctChoiceIndex: 1,
        explanation: "The circuit opens after threshold failures, immediately rejecting requests without attempting them — failing fast instead of wasting resources.",
        conceptIds: ["py.api.circuit_breaker"]
      },
      {
        id: "question-python-circuit-breaker-2",
        prompt: "Your circuit opens but never transitions back to half-open. What is missing?",
        choices: ["A recovery timeout check that allows a trial request after enough time", "A larger failure threshold", "More API endpoints to call"],
        correctChoiceIndex: 0,
        explanation: "The recovery timeout determines when the circuit can attempt a half-open probe. Without it, the circuit stays open forever.",
        conceptIds: ["py.api.circuit_breaker"]
      },
      {
        id: "question-python-circuit-breaker-3",
        prompt: "Why is 'fail fast' better than retrying when the circuit is open?",
        choices: ["It preserves resources and prevents cascading failures by not hammering a down service", "Because failing fast means the user sees an error sooner", "Both A and B"],
        correctChoiceIndex: 2,
        explanation: "Failing fast saves resources (connections, time, threads) that would be wasted on a down service, and gives the user immediate feedback.",
        conceptIds: ["py.api.circuit_breaker"]
      }
    ]
  }
];
