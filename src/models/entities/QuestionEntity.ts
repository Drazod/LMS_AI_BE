import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SectionEntity } from './SectionEntity';

@Entity('question')
export class QuestionEntity {
  @PrimaryGeneratedColumn({ name: 'question_id' })
  questionId!: number;

  @Column({ name: 'question_text', type: 'text' })
  questionText!: string;

  @Column({ name: 'section_id', type: 'bigint' })
  sectionId!: number;

  @ManyToOne(() => SectionEntity)
  @JoinColumn({ name: 'section_id' })
  section!: SectionEntity;
}
