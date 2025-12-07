-- Script para verificar mensajes de invitados
SELECT 
  m.id,
  m.content,
  m.userId,
  m.guestId,
  m.createdAt,
  u.name as user_name,
  p.name as guest_name,
  p.avatar as guest_avatar
FROM "Message" m
LEFT JOIN "User" u ON m.userId = u.id
LEFT JOIN "Participant" p ON m.guestId = p.guestId
WHERE m.routeId = 'cmiu3x8p70003jf04veuaquw5'
ORDER BY m.createdAt DESC
LIMIT 10;
