import { describe, it, expect } from 'vitest';
import { contentPack } from '../src/content/seed';

/**
 * Shipped contentPack test for AC1.
 * Runs against the real assembled contentPack (no mocks).
 * Catches Q2 identical-snippet regressions and bias distribution.
 */
describe('shipped python quizzes (contentPack)', () => {
  const pythonQuizzes = contentPack.quizzes.filter((q: any) => {
    const lesson = contentPack.lessons.find((l: any) => l.id === q.lessonId);
    return q.id.startsWith('quiz-python-') || (lesson && lesson.id.startsWith('lesson-python-'));
  });

  for (const quiz of pythonQuizzes) {
    it(`${quiz.id} has exactly 5 questions, passingScore 80, balanced indices, Q2 variant different from Q1`, () => {
      expect(quiz.questions.length).toBe(5);
      expect(quiz.passingScore).toBe(80);

      const counts: Record<number, number> = {};
      quiz.questions.forEach((q: any) => {
        counts[q.correctChoiceIndex] = (counts[q.correctChoiceIndex] || 0) + 1;
      });
      const max = Math.max(...Object.values(counts));
      expect(max / 5).toBeLessThan(0.8);

      // Q2 must use a different code snippet than Q1 when the "different output" case is the correct answer
      const q1 = quiz.questions[0];
      const q2 = quiz.questions[1];
      if (q2 && q2.prompt && q2.prompt.includes('different output or error')) {
        const code1Match = q1.prompt.match(/```python\n([\s\S]*?)```/);
        const code2Match = q2.prompt.match(/```python\n([\s\S]*?)```/);
        const code1 = (code1Match ? code1Match[1] : '').trim();
        const code2 = (code2Match ? code2Match[1] : '').trim();
        expect(code2).not.toBe(code1);
      }
    });
  }

  it('all quizzes in contentPack with 3+ questions have balanced correctChoiceIndex distribution (< 75% bias)', () => {
    for (const quiz of contentPack.quizzes) {
      if (quiz.questions.length < 3) continue;
      const counts: Record<number, number> = {};
      quiz.questions.forEach((q: any) => {
        counts[q.correctChoiceIndex] = (counts[q.correctChoiceIndex] || 0) + 1;
      });
      const max = Math.max(...Object.values(counts));
      const ratio = max / quiz.questions.length;
      expect(ratio, `Quiz ${quiz.id} has bias ratio ${ratio}`).toBeLessThan(0.75);
    }
  });

  it('python quiz Q3–Q5 distractors vary by concept (no shared generic template)', () => {
    const genericQ3 = "Never — this is just theory";
    const genericQ4 = "A logic error from misunderstanding what the function returns";
    const genericQ5 = "Extract a helper function for the repeated logic";

    for (const quiz of pythonQuizzes) {
      const q3 = quiz.questions[2];
      const q4 = quiz.questions[3];
      const q5 = quiz.questions[4];
      expect(q3?.choices.join("|")).not.toContain(genericQ3);
      expect(q4?.choices.join("|")).not.toContain(genericQ4);
      expect(q5?.choices.join("|")).not.toContain(genericQ5);
    }
  });
});