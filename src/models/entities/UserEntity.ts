import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index
} from 'typeorm';
import { UserRole } from './base';

@Entity('users')
@Index('idx_user_email', ['email'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ length: 255 })
  password!: string;

  @Column({ name: 'avt_url', type: 'varchar', nullable: true })
  avtUrl?: string;

  @Column({ name: 'public_avt_id', type: 'varchar', nullable: true })
  publicAvtId?: string;

  @Column({ name: 'first_name', type: 'varchar', nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', type: 'varchar', nullable: true })
  lastName?: string;

  @Column({ name: 'phone_number', type: 'varchar', nullable: true })
  phoneNumber?: string;

  @Column({ name: 'user_address', type: 'varchar', nullable: true })
  userAddress?: string;

  @Column({ name: 'user_city', type: 'varchar', nullable: true })
  userCity?: string;

  @Column({ name: 'user_country', type: 'varchar', nullable: true })
  userCountry?: string;

  @Column({ name: 'user_postal_code', type: 'bigint', nullable: true })
  userPostalCode?: number;

  @Column({ name: 'user_role', type: 'varchar' })
  role!: string;

  @Column({ type: 'boolean', default: false })
  activated!: boolean;
}