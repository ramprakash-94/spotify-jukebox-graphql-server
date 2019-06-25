
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, Generated, ManyToOne, ManyToMany, JoinTable, PrimaryColumn } from 'typeorm'
import {User} from './User'
import { Playlist } from './Playlist';

@Entity()
export class Track extends BaseEntity {
  @PrimaryColumn()
  id: string

  @Column()
  title: string

  @Column()
  artist: string

  @Column()
  album: string

  @Column()
  albumArt: string

  @ManyToMany(type => Playlist, playlist => playlist.rooms)
  playlists: Playlist[]
}
