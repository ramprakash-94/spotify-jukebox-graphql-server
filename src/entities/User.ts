import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, PrimaryColumn } from 'typeorm'
import {Room} from './Room'

@Entity()
export class User extends BaseEntity {
  @PrimaryColumn()
  id: string

  @Column()
  email: string

  @Column()
  token: string

}
