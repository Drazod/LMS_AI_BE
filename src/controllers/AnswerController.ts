import { Request, Response } from 'express';
import { AnswerService } from '../services/AnswerService';

export class AnswerController {
  private answerService = new AnswerService();

  // POST /api/questions/:questionId/answers
  submitAnswer = async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const { studentId, answerText } = req.body;
      if (!questionId || !studentId || !answerText) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
      const answer = await this.answerService.submitAnswer(questionId, studentId, answerText);
      res.status(201).json({ success: true, data: answer, message: 'Answer submitted' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error', error });
    }
  };

  // GET /api/questions/:questionId/answers
  getAnswersByQuestion = async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.questionId);
      if (!questionId) {
        return res.status(400).json({ success: false, message: 'Missing questionId' });
      }
      const answers = await this.answerService.getAnswersByQuestion(questionId);
      // Return student name and answer
      const result = answers.map(a => ({
        answerId: a.answerId,
        answerText: a.answerText,
        grade: a.grade,
        studentId: a.studentId,
        studentName: a.student?.name || null
      }));
      res.status(200).json({ success: true, data: result, message: 'Answers retrieved' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error', error });
    }
  };

  // PATCH /api/answers/:answerId/grade
  gradeAnswer = async (req: Request, res: Response) => {
    try {
      const answerId = parseInt(req.params.answerId);
      const { grade } = req.body;
      if (!answerId || grade === undefined) {
        return res.status(400).json({ success: false, message: 'Missing answerId or grade' });
      }
      if (grade < 0 || grade > 10) {
        return res.status(400).json({ success: false, message: 'Grade must be between 0 and 10' });
      }
      const answer = await this.answerService.gradeAnswer(answerId, grade);
      if (!answer) {
        return res.status(404).json({ success: false, message: 'Answer not found' });
      }
      res.status(200).json({ success: true, data: answer, message: 'Answer graded' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error', error });
    }
  };
}
