import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, Generated, ManyToOne, ManyToMany } from 'typeorm'
import {Room} from './Room'

@Entity()
export class Playlist extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToMany(type => Room, room => room.playlists)
  rooms: Room[] 

  @Column({type: "simple-array", nullable: true})
  tracks: string[] 
}
