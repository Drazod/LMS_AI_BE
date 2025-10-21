import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { SectionEntity } from './SectionEntity';

export enum ContentType {
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
  TEXT = 'TEXT'
}

@Entity('content')
export class ContentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'integer' })
  position!: number;

  @Column({
    type: 'enum',
    enum: ContentType
  })
  type!: ContentType;

  @Column({ name: 'section_id', type: 'bigint', nullable: true })
  sectionId?: number;

  // Relations
  @ManyToOne(() => SectionEntity, { nullable: true })
  @JoinColumn({ name: 'section_id' })
  section?: SectionEntity;
}