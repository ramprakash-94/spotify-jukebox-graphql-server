import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, Generated, ManyToOne, ManyToMany, JoinTable, PrimaryColumn } from 'typeorm'
import {Room} from './Room'
import { Track } from './Track';

@Entity()
export class Playlist extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({default: 0})
  nowPlaying: number

  @ManyToMany(type => Room, room => room.playlists)
  rooms: Room[] 

  @ManyToMany(type => Track, track => track.playlists)
  @JoinTable()
  tracks: Track[] 
}
