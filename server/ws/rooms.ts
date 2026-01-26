// server/ws/rooms.ts
type WSPeer = any
type RoomName = string

const rooms = new Map<RoomName, Set<WSPeer>>()

export function joinRoom(peer: WSPeer, room: RoomName) {
  if (!rooms.has(room)) {
    rooms.set(room, new Set())
  }
  rooms.get(room)!.add(peer)
}

export function leaveRoom(peer: WSPeer, room: RoomName) {
  rooms.get(room)?.delete(peer)

  if (rooms.get(room)?.size === 0) {
    rooms.delete(room)
  }
}

export function leaveAllRooms(peer: WSPeer) {
  for (const peers of rooms.values()) {
    peers.delete(peer)
  }
}

export function broadcast(room: RoomName, payload: any) {
  const peers = rooms.get(room)
  if (!peers) return

  const message = JSON.stringify(payload)
  for (const peer of peers) {
    peer.send(message)
  }
}
