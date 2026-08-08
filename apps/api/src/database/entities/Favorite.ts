import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User.js';
import { SkillItem } from './SkillItem.js';

@Entity()
export class Favorite {
  @PrimaryColumn({ type: 'uuid' })
  userId!: string;

  @PrimaryColumn({ type: 'uuid' })
  skillId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => SkillItem, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'skillId' })
  skillItem!: SkillItem;

  @CreateDateColumn({ type: 'timestamptz', nullable: false })
  createdAt!: Date;
}
