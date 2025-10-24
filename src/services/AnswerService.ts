import { getRepository, Repository } from 'typeorm';
import { AnswerEntity } from '../models/entities/AnswerEntity';
import { UserEntity } from '../models/entities/UserEntity';
import { QuestionEntity } from '../models/entities/QuestionEntity';

export class AnswerService {
  private answerRepository?: Repository<AnswerEntity>;
  private userRepository?: Repository<UserEntity>;

  private getAnswerRepository(): Repository<AnswerEntity> {
    if (!this.answerRepository) {
      this.answerRepository = getRepository(AnswerEntity);
    }
    return this.answerRepository;
  }

  private getUserRepository(): Repository<UserEntity> {
    if (!this.userRepository) {
      this.userRepository = getRepository(UserEntity);
    }
    return this.userRepository;
  }

  async submitAnswer(questionId: number, studentId: number, answerText: string): Promise<AnswerEntity> {
    const repo = this.getAnswerRepository();
    const answer = repo.create({ questionId, studentId, answerText });
    return await repo.save(answer);
  }

  async getAnswersByQuestion(questionId: number): Promise<AnswerEntity[]> {
    return this.getAnswerRepository().find({
      where: { questionId },
      relations: ['student']
    });
  }

  async gradeAnswer(answerId: number, grade: number): Promise<AnswerEntity | null> {
    const repo = this.getAnswerRepository();
    const answer = await repo.findOne({ where: { answerId } });
    if (!answer) return null;
    answer.grade = grade;
    return await repo.save(answer);
  }
}
