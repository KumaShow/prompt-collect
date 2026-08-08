import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Relation
} from 'typeorm';
import { SkillItem } from './SkillItem.js';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
  })
  name!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @CreateDateColumn({ type: 'timestamptz', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', nullable: false })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => SkillItem, (skillItem) => skillItem.category)
  skillItems!: Relation<SkillItem[]>;
}
