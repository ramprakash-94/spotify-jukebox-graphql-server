import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany } from 'typeorm'
import {Room} from './Room'

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  userType: string

  @OneToMany(type => Room, room => room.admin)
  rooms: Room[]
}
