import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { QuestionEntity } from './QuestionEntity';
import { UserEntity } from './UserEntity';

@Entity('answer')
export class AnswerEntity {
  @PrimaryGeneratedColumn({ name: 'answer_id' })
  answerId!: number;

  @Column({ name: 'answer_text', type: 'text' })
  answerText!: string;

  @Column({ name: 'grade', type: 'int', nullable: true })
  grade?: number;

  @Column({ name: 'question_id', type: 'bigint' })
  questionId!: number;

  @Column({ name: 'student_id', type: 'bigint' })
  studentId!: number;

  @ManyToOne(() => QuestionEntity)
  @JoinColumn({ name: 'question_id' })
  question!: QuestionEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'student_id' })
  student!: UserEntity;
}
