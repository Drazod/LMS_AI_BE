import { getRepository, Repository } from 'typeorm';
import { QuestionEntity } from '../models/entities/QuestionEntity';

export class QuestionService {
  private questionRepository?: Repository<QuestionEntity>;

  private getQuestionRepository(): Repository<QuestionEntity> {
    if (!this.questionRepository) {
      this.questionRepository = getRepository(QuestionEntity);
    }
    return this.questionRepository;
  }

  async createQuestions(sectionId: number, questions: { questionText: string }[]): Promise<QuestionEntity[]> {
    if (!questions || questions.length === 0) return [];
    const repo = this.getQuestionRepository();
    const questionEntities = questions.map(q => repo.create({ sectionId, questionText: q.questionText }));
    return await repo.save(questionEntities);
  }

  async getQuestionsBySection(sectionId: number): Promise<QuestionEntity[]> {
    return this.getQuestionRepository().find({ where: { sectionId } });
  }
}
