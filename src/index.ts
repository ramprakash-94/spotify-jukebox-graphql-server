import { GraphQLServer } from 'graphql-yoga'
import { createConnection, getRepository, Repository, Code } from 'typeorm';
import { User } from './entities/User';
import { Room } from './entities/Room';
import { createBrotliCompress } from 'zlib';
import { Playlist } from './entities/Playlist';
import { Track } from './entities/Track';
const express = require('express')

let mode = "dev"
let redirect_uri = null

if (mode === "dev"){
  // redirect_uri = "http://localhost:3000/spotify-auth"
  redirect_uri = "http://10.0.0.241:3000/spotify-auth"
}
else if (mode === "prod"){
  redirect_uri = "https://web-jukebox.herokuapp.com/spotify-auth"
}

const fetch = require('node-fetch')

const typeDefs = `
  type User {
    id: ID!
    email: String!
    token: String!
    rooms: [Room!]!
  }
  type Room{
    id: ID!
    number: Int!
    admin: User!
    currentTrack: Track!
    position: Int!
    duration: Int!
    playing: Boolean!
    playlists: [Playlist!]!
  }
  type Track{
    id: ID!
    uri: String!
    title: String!
    artist: String!
    album: String!
    albumArt: String!
    playlists: [Playlist!]!
    user: User!
  }
  type Playlist{
    id: ID!
    rooms: [Room!]!
    tracks: [Track!]!
  }
  type Query {
    hello(name: String): String!
    user(id: ID!): User!
    room(num: Int!): Room!
    users(ids: [ID!]): [User!]!
    allUsers(limit: Int): [User!]!
    allRooms(limit: Int): [Room!]!
    allTracksInPlaylist(id: ID!): Playlist
  }
  type Mutation {
    addUser(token: String!, type: String!): User
    createRoom(userId: ID!): Room
    insertTrack(playlistId: ID!, track: String!, token: String!): Playlist
    popTrack(playlistId: ID!): Playlist
    spotifyAuth(code: String!): User 
    updateRoom(num: Int!, track: String!, position: Int!, duration: Int!, playing: Boolean!, token: String!): Room!
  }
`;

const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name || 'World'}`,
    // this is the user resolver
    user: (_, { id }) => {
      return getRepository(User).findOne(id)
    },
    room: async(_, { num }) => {
      let roomItem = await getRepository(Room).find({ where:{ number: num, }, 
        // join:{
        //   alias: "room",
        //   leftJoinAndSelect:{
        //     "admin": "room.admin",
        //     "playlists": "room.playlists",
        //     "tracks": "playlists.tracks"
        //   },
        // },
          relations: ["admin", "playlists", "currentTrack"]
       })
      return roomItem[0]
      
     },
    users: (_, {ids}) => {
      return getRepository(User).findByIds(ids)
    },
    allUsers: (_, {limit}) => {
      return getRepository(User).find({
        take: limit, 
        relations: ["rooms"]
      })
    },
    allRooms: (_, {limit}) => {
      return getRepository(Room).find({
        take: limit, 
        relations: ["admin", "playlists"]
      })
    },
    allTracksInPlaylist: async(_, {id}) => {
      const playlists =  await Playlist.find({
        where:{
          id: id
        },
        relations: ["tracks"]
      })
      console.log(playlists)
      return playlists[0]
    },

  },
  Mutation: {
    // this is the addUser resolver
    addUser: (_, {token, type}) => {
      const user = new User()
      user.token = token
      user.rooms = []
      return getRepository(User).save(user)
    },

    createRoom: async(_, {userId}) => {
      const user = await User.findOne(userId)
      if (!user) {
        throw new Error(`Couldn’t find user with id ${userId}`);
      }
      // New Room
      const room = new Room()
      console.log(user)
      room.admin = user // Set Admin
      room.currentTrack = null
      room.duration = 1500
      room.position = 0
      room.playing = false

      // Create Spotify playlist
      // const {playlistId, playlistURI} = await createPlaylist(user.token, user.id, room.number)
      // New Playlist
      const playlist = new Playlist()
      playlist.tracks = []
      await getRepository(Playlist).save(playlist)

      const roomPlaylists = [playlist]
      room.playlists = roomPlaylists
      await getRepository(Room).save(room)
      return room
    },
    spotifyAuth: async(_, {code}) => {
      let user = await manageUserTokens(code)
      return user
    },
    popTrack: async(_, {playlistId}) => {
      const playlists = await Playlist.find({
        where:{
          id: playlistId
        },
        relations: ["tracks"]
      })
      const playlist = playlists[0]
      let tracks = playlist.tracks
      tracks.shift()
      playlist.tracks = tracks
      await getRepository(Playlist).save(playlist)
      return playlist

    },
    updateRoom: async(_, {num, track, position, duration, playing, token}) => {
      console.log(num)
      console.log(track)
      console.log(position)
      console.log(duration)
      console.log(playing)
      console.log(token)
      let rooms = await getRepository(Room).find({ where:{ number: num, }, 
        // join:{
        //   alias: "room",
        //   leftJoinAndSelect:{
        //     "admin": "room.admin",
        //     "playlists": "room.playlists",
        //     "tracks": "playlist.tracks"
        //   },
        // },
          relations: ["admin", "currentTrack", "playlists", "playlists.tracks"]
       })
       let room = rooms[0]

      const existingTrack = room.currentTrack
      if ( existingTrack === null || (existingTrack !== null && existingTrack.id !== track)){
        const trackInfo = await getTrackInformation(track, token)
        const trackObj = new Track()
        trackObj.uri = track
        trackObj.title = trackInfo.title
        trackObj.album = trackInfo.album
        trackObj.artist = trackInfo.artist
        trackObj.albumArt = trackInfo.albumArt
        await getRepository(Track).save(trackObj)

        room.currentTrack = trackObj
      }

      room.position = parseInt(position) 
      room.duration = parseInt(duration)
      room.playing = playing
      return getRepository(Room).save(room)
    },
    insertTrack: async(_, {playlistId, track, token}) => {
      // const playlist = await Playlist.findOne(playlistId)
      console.log(playlistId)
      console.log(track)
      console.log(token)
      const playlists = await Playlist.find({
        where:{
          id: playlistId
        },
        relations: ["tracks"]
      })
      const playlist = playlists[0]

      if (!playlist) {
        throw new Error(`Couldn’t find playlist with id ${playlistId}`);
      }

      const trackInfo = await getTrackInformation(track, token)
      const trackObj = new Track()
      trackObj.uri = track
      trackObj.title = trackInfo.title
      trackObj.album = trackInfo.album
      trackObj.artist = trackInfo.artist
      trackObj.albumArt = trackInfo.albumArt
      await getRepository(Track).save(trackObj)

      let tracks = playlist.tracks
      console.log(tracks)
      if (tracks){
        console.log("Inserting Track")
        tracks.push(trackObj)
      }
      else{
        console.log("First track")
        tracks = [trackObj]
      }
      playlist.tracks = tracks
      console.log(tracks)
      console.log(playlist)
      await getRepository(Playlist).save(playlist)
      return playlist
    }
  },
}

const server = new GraphQLServer({ typeDefs, resolvers })
server.express.use("/.well-known/acme-challenge", express.static("static"))

createConnection().then(() => {
  server.start(() => console.log("Server is running on localhost:5432"));
}).catch((msg) => {
  console.log("Couldn't connect to the database.")
  console.log(msg);
});

async function manageUserTokens(token){

  const tokenData = await getSpotifyTokens(token)
  const userData = await getUserInfo(tokenData["access_token"])
  if (userData["id"]){
    const user = new User()
    user.id = userData["id"]
    user.email = userData["email"]
    user.token = tokenData["access_token"]
    user.rooms = []
    return getRepository(User).save(user)
  }
  return null
}
async function getUserInfo(token){

  let userData = {}
  await fetch(`https://api.spotify.com/v1/me`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded"
    }
  }).then(response => response.json())
  .then(function(data){
    console.log(data)
    userData = data
 })
  .catch(function (error){
    console.log("Error")
    console.log(error);
  });
  return userData
}

async function getSpotifyTokens(code){

    let tokenData = null
    const body = {
      "grant_type": "authorization_code",
      "code": code,
      "redirect_uri": redirect_uri,
      "client_id": "91b73766037a44e7a855d5cf2b0c8768",
      "client_secret": "57aec0bb5666401495117560bd5a6c3f"
    }
    let formBody = []
    for (let property in body) {
      let encodedKey = encodeURIComponent(property);
      let encodedValue = encodeURIComponent(body[property]);
      formBody.push(encodedKey + "=" + encodedValue);
  }
   let final = formBody.join("&")
  await fetch(`https://accounts.spotify.com/api/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: final 
  }).then(response => response.json())
  .then(function(data){
    console.log("Success")
    console.log(data)
    tokenData = data
 })
  .catch(function (error){
    console.log("Error")
    console.log(error);
  });
  return tokenData
}

async function getTrackInformation(trackURI, token){

  let title, album, artist, albumArt = null
  console.log(trackURI)
  console.log(token)
  const trackId = trackURI.replace("spotify:track:", "");
  await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).then(response => response.json())
  .then(function(data){
    title = data.name
    album = data.album.name
    artist = data.artists[0].name
    albumArt = data.album.images[0].url
  })
  .catch(function (error){
    console.log(error);
  });
  return {
    title: title,
    album: album,
    artist: artist,
    albumArt: albumArt
  }
}

async function createPlaylist(token, userId, roomNumber){
  console.log(token)
  let playlistURI = null
  let playlistId = null
  await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      "name": "Jukebox Room " + roomNumber,
      "public": true
    }),
  }).then(response => response.json())
  .then(function(data){
      console.log(data.uri)
      playlistURI = data.uri
      playlistId = data.id
  })
  .catch(function (error){
    console.log(error);
  });
  return {
    playlistId: playlistId,
    playlistURI: playlistURI
  }
}