import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, Generated, ManyToOne, ManyToMany, JoinTable, OneToOne, JoinColumn, Index } from 'typeorm'
import {User} from './User'
import { Playlist } from './Playlist';
import { Track } from './Track';

@Entity()
export class Room extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  @Generated("increment")
  number: number

  @Index()
  @Column()
  admin: String 

  @Column({nullable: true})
  currentTrack: String

  @Column("integer")
  position: number

  @Column("integer")
  duration: number

  @Column()
  playing: Boolean

  @ManyToMany(type => Playlist, playlist => playlist.rooms)
  @JoinTable()
  playlists: Playlist[]
}

