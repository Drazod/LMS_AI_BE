import { QuestionEntity } from './QuestionEntity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { CourseEntity } from './CourseEntity';

export enum SessionType {
  LISTEN = 'LISTEN',
  READING = 'READING',
  SPEAKING = 'SPEAKING'
}

@Entity('section')
export class SectionEntity {
  @PrimaryGeneratedColumn({ name: 'section_id' })
  sectionId!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'bigint' })
  position!: number;

  @Column({ name: 'section_name', length: 255 })
  sectionName!: string;

  @Column({
    name: 'session_type',
    type: 'enum',
    enum: SessionType,
    nullable: true
  })
  sessionType?: SessionType;

  @Column({ length: 255, nullable: true })
  title?: string;

  @Column({ name: 'course_id', type: 'bigint', nullable: true })
  courseId?: number;

  // Relations
  @ManyToOne(() => CourseEntity, { nullable: true })
  @JoinColumn({ name: 'course_id' })
  course?: CourseEntity;

  @OneToMany(() => QuestionEntity, (question) => question.section)
  questions?: QuestionEntity[];
}